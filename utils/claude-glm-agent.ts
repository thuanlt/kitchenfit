/**
 * claude-glm-agent.ts
 *
 * Multi-agent pipeline:
 *   Claude Sonnet 4.6  →  Orchestrator (lên kế hoạch, review, fix)
 *   GLM-4.7 (FPT)      →  Code Generator (primary)
 *   Fallback chain     →  Qwen2.5-Coder-32B → Qwen3-Coder-480B → DeepSeek-V3.2-Speciale
 *
 * Usage:
 *   npx ts-node utils/claude-glm-agent.ts
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

// ─── Proxy setup (required in corporate networks) ────────────────────────────
// Node.js does not automatically use the system proxy, so we need to configure
// undici (used by the Anthropic SDK's fetch) to route through the proxy.
const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://10.36.252.45:8080';
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ProxyAgent, setGlobalDispatcher } = require('undici');
  setGlobalDispatcher(new ProxyAgent(PROXY_URL));
} catch {
  // undici not available — skip proxy setup
}

// ─── Clients ─────────────────────────────────────────────────────────────────

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const fpt = new OpenAI({
  apiKey: process.env.FPT_API_KEY!,
  baseURL: `${process.env.FPT_API_URL}/v1`,
});

const FROM = process.env.FPT_FROM ?? '';

// ─── Code Generator Models (fallback chain) ───────────────────────────────────

const CODE_MODELS = [
  'Kimi-K2.5',                        // primary: reasoning + 256K context
  'GLM-4.7',                          // backup 1
  'Qwen2.5-Coder-32B-Instruct',       // backup 2: chuyên code
  'DeepSeek-V3.2-Speciale',           // backup 3: general + code
];

const SYSTEM_PROMPT =
  'You are an expert TypeScript/Playwright test engineer. ' +
  'Generate clean, well-structured test code based on the given requirements. ' +
  'Output ONLY the code. No thinking, no reasoning, no explanations, no markdown prose.';

async function callFPTModel(model: string, prompt: string): Promise<string> {
  const res = await fpt.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 2048,
    extra_query: { from: FROM },
  } as any);
  const content = res.choices[0]?.message?.content ?? '';
  if (!content) throw new Error('Empty response');
  return content;
}

async function callCodeGenerator(prompt: string): Promise<string> {
  for (const model of CODE_MODELS) {
    try {
      console.log(`\n🤖 [${model}] Generating code...`);
      const code = await callFPTModel(model, prompt);
      console.log(`✅ [${model}] Generated ${code.length} chars`);
      return code;
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status ?? '?';
      console.warn(`⚠️  [${model}] Failed (${status}) — trying next model...`);
    }
  }
  throw new Error('All code generator models failed.');
}

// ─── Tool Definition for Claude ───────────────────────────────────────────────

const tools: Anthropic.Tool[] = [
  {
    name: 'generate_code_with_glm',
    description:
      'Delegate code generation to GLM-4.7 model. ' +
      'Use this when you need to generate TypeScript/Playwright test code. ' +
      'Provide a detailed prompt with all requirements, file structure, and expected behavior.',
    input_schema: {
      type: 'object' as const,
      properties: {
        prompt: {
          type: 'string',
          description:
            'Detailed code generation prompt including: ' +
            '1) What to build, 2) File structure, 3) Test cases to cover, ' +
            '4) Any specific patterns or imports required.',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'refine_code_with_glm',
    description:
      'Ask GLM-4.7 to refine or fix existing code. ' +
      'Use this when the generated code needs improvements or bug fixes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        current_code: {
          type: 'string',
          description: 'The current code that needs refinement.',
        },
        issues: {
          type: 'string',
          description: 'Description of issues or improvements needed.',
        },
      },
      required: ['current_code', 'issues'],
    },
  },
];

// ─── Tool Executor ─────────────────────────────────────────────────────────────

async function executeTool(name: string, input: Record<string, string>): Promise<string> {
  if (name === 'generate_code_with_glm') {
    return callCodeGenerator(input.prompt);
  }
  if (name === 'refine_code_with_glm') {
    const prompt =
      `Fix and refine the following code:\n\n${input.current_code}\n\n` +
      `Issues to address:\n${input.issues}`;
    return callCodeGenerator(prompt);
  }
  return `Unknown tool: ${name}`;
}

// ─── Main Agent Loop ───────────────────────────────────────────────────────────

export async function runAgent(task: string): Promise<string> {
  console.log('\n🎯 Task:', task);
  console.log('─'.repeat(60));

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: task },
  ];

  let iteration = 0;
  const MAX_ITERATIONS = 5;

  while (iteration < MAX_ITERATIONS) {
    iteration++;
    console.log(`\n🔄 [Claude] Iteration ${iteration}...`);

    const response = await claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system:
        'You are a senior QA engineer and test architect. ' +
        'Your job is to plan, delegate, and review test code generation. ' +
        'Use generate_code_with_glm to delegate actual code writing to GLM-4.7. ' +
        'After receiving generated code, review it carefully. ' +
        'If the code has issues, use refine_code_with_glm to fix them. ' +
        'Return the final polished code when done.',
      tools,
      messages,
    });

    // Collect text output
    for (const block of response.content) {
      if (block.type === 'text' && block.text) {
        console.log(`\n💬 [Claude]: ${block.text.substring(0, 200)}...`);
      }
    }

    // Done
    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(b => b.type === 'text');
      const result = textBlock && textBlock.type === 'text' ? textBlock.text : '';
      console.log('\n✅ [Claude] Task complete.');
      return result;
    }

    // Handle tool calls
    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );

      messages.push({ role: 'assistant', content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const tool of toolUseBlocks) {
        console.log(`\n🔧 [Claude] Calling tool: ${tool.name}`);
        const result = await executeTool(tool.name, tool.input as Record<string, string>);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tool.id,
          content: result,
        });
      }

      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // Unexpected stop
    break;
  }

  return 'Max iterations reached.';
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────────

async function main() {
  const task = process.argv.slice(2).join(' ') ||
    'Viết Playwright test case TypeScript cho màn hình Login của ' +
    'https://practicetestautomation.com/practice-test-login/ ' +
    'Bao gồm: TC_LOGIN_001 login thành công, TC_LOGIN_002 sai password, ' +
    'TC_LOGIN_003 để trống username. Dùng storageState nếu cần.';

  const result = await runAgent(task);

  console.log('\n' + '═'.repeat(60));
  console.log('📄 FINAL OUTPUT:');
  console.log('═'.repeat(60));
  console.log(result);
}

main().catch(console.error);
