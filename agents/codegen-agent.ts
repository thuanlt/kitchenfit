/**
 * agents/codegen-agent.ts
 * Multi-agent pipeline: Orchestrator (Claude / Qwen3) → Code Generator (FPT fallback chain)
 *
 * Orchestrators:
 *   Claude Sonnet 4.6  — default (plan, review, fix, iterate)
 *   Qwen3-32B thinking — alternative (--qwen flag, no Anthropic key needed)
 *
 * Code Generator (shared):
 *   Fallback chain: Kimi-K2.5 → GLM-4.7 → Qwen2.5-Coder-32B → DeepSeek-V3.2-Speciale
 *
 * Usage:
 *   npx ts-node agents/codegen-agent.ts "Viết test cho login page"
 *   npx ts-node agents/codegen-agent.ts --qwen "Viết test cho login page"
 *   npx ts-node agents/codegen-agent.ts --save "Viết test..."
 */

import Anthropic from '@anthropic-ai/sdk';

// ── Retry 529 ─────────────────────────────────────────────────────────────────
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const is529 = err?.status === 529 || err?.message?.includes('overloaded');
      if (is529 && i < maxRetries - 1) {
        const wait = Math.pow(2, i) * 1000;
        console.warn(`⚠️  529 Overloaded — retry ${i + 1}/${maxRetries} in ${wait}ms`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries reached');
}
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { ProxyAgent } from 'undici';
import { CODE_MODELS, callFptWithFallback } from '../tools/fpt-client';
import { wrapWithLangfuse, startAgentTrace, flushLangfuse } from '../tools/langfuse-client';

dotenv.config();

// ── Proxy ─────────────────────────────────────────────────────────────────────
const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
if (PROXY_URL) {
  try {
    const { setGlobalDispatcher } = require('undici');
    setGlobalDispatcher(new ProxyAgent(PROXY_URL));
  } catch { /* ignore */ }
}

function makeFptDispatcher() {
  return PROXY_URL
    ? new ProxyAgent({ uri: PROXY_URL, connections: 1, pipelining: 0 })
    : undefined;
}

// ── Clients ───────────────────────────────────────────────────────────────────
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const fpt = new OpenAI({
  apiKey:   process.env.FPT_API_KEY!,
  baseURL:  `${process.env.FPT_API_URL ?? 'https://mkp-api.fptcloud.com'}/v1`,
  fetchOptions: { dispatcher: makeFptDispatcher() } as any,
});

const FROM = process.env.FPT_FROM ?? '';

// ── Prompts ───────────────────────────────────────────────────────────────────
const GEN_SYSTEM = `
You are an expert Playwright TypeScript test engineer for FPT Marketplace.
Generate clean, complete, runnable Playwright tests.
- Use @playwright/test
- Include proper selectors, assertions, and error handling
- Follow the project's existing patterns
- Return ONLY the TypeScript code block, no explanation
`.trim();

const ORCHESTRATOR_SYSTEM = `
You are an AI test orchestration agent for FPT Marketplace.
You plan, delegate code generation, review results, and iterate until the test is correct.

When you need code generated, output a JSON block:
{"action":"generate","prompt":"exact prompt for code generator"}

When the result is satisfactory:
{"action":"done","code":"final code here"}

When something needs fixing:
{"action":"fix","issue":"description of issue","prompt":"updated prompt"}
`.trim();

// ── Code Generator (shared by both orchestrators) ─────────────────────────────
async function generateCode(prompt: string, sessionId?: string): Promise<string> {
  const trace = sessionId
    ? { generationName: 'code-gen', sessionId }
    : undefined;

  const tracedFpt = trace ? wrapWithLangfuse(fpt, trace) : fpt;

  const res = await (tracedFpt as any).chat.completions.create({
    model:       CODE_MODELS[0],
    messages:    [{ role: 'system', content: GEN_SYSTEM }, { role: 'user', content: prompt }],
    max_tokens:  4096,
    temperature: 0.2,
  });

  const content = res.choices[0]?.message?.content ?? '';
  if (!content) {
    // Fallback to chain
    const fallback = await callFptWithFallback(
      [{ role: 'system', content: GEN_SYSTEM }, { role: 'user', content: prompt }],
      { maxTokens: 4096 },
    );
    return fallback.content;
  }
  return content;
}

// ── Orchestrator: Claude ──────────────────────────────────────────────────────
async function runWithClaude(task: string): Promise<string> {
  console.log('\n🧠 Orchestrator: Claude Sonnet 4.6');
  const trace = startAgentTrace('codegen-agent', { task, orchestrator: 'claude' });
  const sessionId = `claude-${Date.now()}`;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: `Task: ${task}\n\nStart by planning the test structure, then request code generation.` },
  ];

  let finalCode = '';

  for (let iter = 0; iter < 5; iter++) {
    let res: any;
    try {
      res = await callWithRetry(() => claude.messages.create({
        model:     'claude-sonnet-4-6',
        max_tokens: 2048,
        system:    ORCHESTRATOR_SYSTEM,
        messages,
      }));
    } catch (err: any) {
      const isCredits = err?.message?.includes('credit balance') || err?.status === 402;
      if (isCredits) {
        console.warn('\n⚠️  Anthropic credits exhausted — auto-switching to Qwen3-32B orchestrator');
        await flushLangfuse();
        return runWithQwen(task);
      }
      throw err;
    }

    const text = res.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    messages.push({ role: 'assistant', content: text });
    console.log(`\n[Iter ${iter + 1}] Claude: ${text.substring(0, 120)}...`);

    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) break;

    const action = JSON.parse(jsonMatch[0]);

    if (action.action === 'done') {
      finalCode = action.code;
      break;
    }

    if (action.action === 'generate' || action.action === 'fix') {
      console.log(`\n🔧 Code Generator: ${action.prompt.substring(0, 80)}...`);
      const code = await generateCode(action.prompt, sessionId);
      messages.push({ role: 'user', content: `Generated code:\n\`\`\`typescript\n${code}\n\`\`\`` });
    }
  }

  await flushLangfuse();
  trace.update({ output: finalCode.substring(0, 200) });
  return finalCode;
}

// ── Orchestrator: Qwen3-32B ───────────────────────────────────────────────────
async function runWithQwen(task: string): Promise<string> {
  console.log('\n🧠 Orchestrator: Qwen3-32B (thinking mode)');
  const trace = startAgentTrace('codegen-agent', { task, orchestrator: 'qwen3' });

  const qwenMessages: any[] = [
    { role: 'system', content: ORCHESTRATOR_SYSTEM },
    { role: 'user',   content: `Task: ${task}\n\nPlan and generate the test.` },
  ];

  const res = await fpt.chat.completions.create({
    model:       'Qwen3-32B',
    messages:    qwenMessages,
    max_tokens:  4096,
    temperature: 0.6,
  } as any);

  const plan = res.choices[0]?.message?.content ?? '';

  // Extract generation prompt and generate code
  const jsonMatch = plan.match(/\{[\s\S]*?\}/);
  let finalCode = plan;

  if (jsonMatch) {
    const action = JSON.parse(jsonMatch[0]);
    if (action.action === 'generate' || action.action === 'fix') {
      finalCode = await generateCode(action.prompt);
    } else if (action.action === 'done') {
      finalCode = action.code;
    }
  }

  await flushLangfuse();
  trace.update({ output: finalCode.substring(0, 200) });
  return finalCode;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const cliArgs  = process.argv.slice(2);
const useQwen  = cliArgs.includes('--qwen');
const savFlag  = cliArgs.includes('--save');
const taskArg  = cliArgs.filter(a => !a.startsWith('--')).join(' ');

if (!taskArg) {
  console.error('Usage: npx ts-node agents/codegen-agent.ts [--qwen] [--save] "task description"');
  process.exit(1);
}

(async () => {
  const code = useQwen ? await runWithQwen(taskArg) : await runWithClaude(taskArg);

  if (savFlag) {
    const fs = require('fs');
    const path = require('path');
    const outDir  = path.resolve(__dirname, '../automation-tests/packages/products/fpt-marketplace/src/tests/api/generated');
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `generated-${Date.now()}.spec.ts`);
    fs.writeFileSync(outFile, code);
    console.log(`\n💾 Saved: ${outFile}`);
  } else {
    console.log('\n\n📄 Generated Code:\n');
    console.log(code);
  }
  process.exit(0);
})().catch(err => { console.error('❌ codegen-agent error:', err.message); process.exit(1); });
