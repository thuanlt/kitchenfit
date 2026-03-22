/**
 * claude-glm-agent.ts
 *
 * Multi-agent pipeline với 2 orchestrator lựa chọn:
 *
 *   Claude Sonnet 4.6  →  Orchestrator mặc định (plan, review, fix)
 *   Qwen3-32B thinking →  Orchestrator thay thế (--qwen flag, rẻ hơn, không cần Anthropic key)
 *
 *   Code Generator (cả 2 dùng chung):
 *     Fallback chain: Kimi-K2.5 → GLM-4.7 → Qwen2.5-Coder-32B → DeepSeek-V3.2-Speciale
 *
 * Usage:
 *   npx ts-node utils/claude-glm-agent.ts "task"          # Claude (default)
 *   npx ts-node utils/claude-glm-agent.ts --qwen "task"   # Qwen3-32B thinking
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { ProxyAgent } from 'undici';
import { CODE_MODELS } from './fpt-agent';
dotenv.config();

// ─── Proxy setup ──────────────────────────────────────────────────────────────
// setGlobalDispatcher only applies to undici's own fetch(), NOT to the OpenAI SDK
// which manages its own internal connection pool. For the SDK we pass the dispatcher
// directly via fetchOptions — and disable keepAlive to prevent UND_ERR_SOCKET
// when the proxy closes the connection between orchestrator iterations.
const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://10.36.252.45:8080';

// Global dispatcher for Anthropic SDK (uses undici fetch internally)
try {
  const { setGlobalDispatcher } = require('undici');
  setGlobalDispatcher(new ProxyAgent(PROXY_URL));
} catch { /* undici not available */ }

// Per-request dispatcher for FPT/OpenAI SDK — no keep-alive to avoid socket reuse errors
function makeFptDispatcher() {
  return new ProxyAgent({ uri: PROXY_URL, connections: 1, pipelining: 0 });
}

// ─── Clients ─────────────────────────────────────────────────────────────────

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const fpt = new OpenAI({
  apiKey:   process.env.FPT_API_KEY!,
  baseURL:  `${process.env.FPT_API_URL}/v1`,
  // Fresh dispatcher per client — prevents UND_ERR_SOCKET on iteration 2+
  fetchOptions: { dispatcher: makeFptDispatcher() } as any,
});

const FROM = process.env.FPT_FROM ?? '';

// ─── Shared: Code Generator (fallback chain) ──────────────────────────────────

const GEN_SYSTEM =
  'You are an expert TypeScript/Playwright test engineer. ' +
  'Generate clean, well-structured test code based on the given requirements. ' +
  'Output ONLY the code. No thinking, no reasoning, no explanations, no markdown prose.';

async function callFPTModel(model: string, prompt: string): Promise<string> {
  const res = await fpt.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: GEN_SYSTEM },
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

// ─── Shared: Tool Executor ────────────────────────────────────────────────────

async function executeTool(name: string, input: Record<string, string>): Promise<string> {
  if (name === 'generate_code_with_glm') {
    return callCodeGenerator(input.prompt);
  }
  if (name === 'refine_code_with_glm') {
    return callCodeGenerator(
      `Fix and refine the following code:\n\n${input.current_code}\n\nIssues to address:\n${input.issues}`,
    );
  }
  return `Unknown tool: ${name}`;
}

// ─── Tool definitions: Anthropic format (Claude) ─────────────────────────────

const claudeTools: Anthropic.Tool[] = [
  {
    name: 'generate_code_with_glm',
    description:
      'Delegate code generation to GLM-4.7 model. ' +
      'Use this when you need to generate TypeScript/Playwright test code.',
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
    description: 'Ask GLM-4.7 to refine or fix existing code.',
    input_schema: {
      type: 'object' as const,
      properties: {
        current_code: { type: 'string', description: 'The current code that needs refinement.' },
        issues:       { type: 'string', description: 'Description of issues or improvements needed.' },
      },
      required: ['current_code', 'issues'],
    },
  },
];

// ─── Tool definitions: OpenAI format (Qwen3) ─────────────────────────────────

const qwenTools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'generate_code_with_glm',
      description:
        'Delegate code generation to GLM-4.7 model. ' +
        'Use this when you need to generate TypeScript/Playwright test code.',
      parameters: {
        type: 'object',
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
  },
  {
    type: 'function',
    function: {
      name: 'refine_code_with_glm',
      description: 'Ask GLM-4.7 to refine or fix existing code.',
      parameters: {
        type: 'object',
        properties: {
          current_code: { type: 'string', description: 'The current code that needs refinement.' },
          issues:       { type: 'string', description: 'Description of issues or improvements needed.' },
        },
        required: ['current_code', 'issues'],
      },
    },
  },
];

// ─── Orchestrator system prompt (shared intent, different formats) ─────────────

const ORCHESTRATOR_SYSTEM =
  'You are a senior QA engineer and test architect. ' +
  'Your job is to plan, delegate, and review test code generation. ' +
  'Use generate_code_with_glm to delegate actual code writing to GLM-4.7. ' +
  'After receiving generated code, review it carefully. ' +
  'If the code has issues, use refine_code_with_glm to fix them. ' +
  'Return the final polished code when done.';

// ─── Agent Loop A: Claude Sonnet 4.6 ─────────────────────────────────────────

export async function runClaudeAgent(task: string): Promise<string> {
  console.log('\n🎯 Task:', task);
  console.log('─'.repeat(60));

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: task }];
  let iteration = 0;

  while (iteration < 5) {
    iteration++;
    console.log(`\n🔄 [Claude] Iteration ${iteration}...`);

    const response = await claude.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 4096,
      system:     ORCHESTRATOR_SYSTEM,
      tools:      claudeTools,
      messages,
    });

    for (const block of response.content) {
      if (block.type === 'text' && block.text) {
        console.log(`\n💬 [Claude]: ${block.text.substring(0, 200)}...`);
      }
    }

    if (response.stop_reason === 'end_turn') {
      console.log('\n✅ [Claude] Task complete.');
      const textBlock = response.content.find(b => b.type === 'text');
      return textBlock && textBlock.type === 'text' ? textBlock.text : '';
    }

    if (response.stop_reason === 'tool_use') {
      const toolBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );
      messages.push({ role: 'assistant', content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const tool of toolBlocks) {
        console.log(`\n🔧 [Claude] Calling tool: ${tool.name}`);
        const result = await executeTool(tool.name, tool.input as Record<string, string>);
        toolResults.push({ type: 'tool_result', tool_use_id: tool.id, content: result });
      }
      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    break;
  }

  return 'Max iterations reached.';
}

// ─── Agent Loop B: Qwen3-32B thinking ────────────────────────────────────────

export async function runQwenAgent(task: string): Promise<string> {
  console.log('\n🎯 Task:', task);
  console.log('─'.repeat(60));

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: ORCHESTRATOR_SYSTEM },
    { role: 'user',   content: task },
  ];
  let iteration = 0;

  while (iteration < 5) {
    iteration++;
    console.log(`\n🔄 [Qwen3-32B] Iteration ${iteration}...`);

    const response = await fpt.chat.completions.create({
      model:      'Qwen3-32B',
      messages,
      tools:      qwenTools,
      max_tokens: 4096,
      ...({ extra_body: { chat_template_kwargs: { thinking: true } } } as any),
    });

    const msg          = response.choices[0].message;
    const finishReason = response.choices[0].finish_reason;

    if (msg.content) {
      // Strip <think>...</think> for cleaner display
      const display = msg.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      if (display) console.log(`\n💬 [Qwen3]: ${display.substring(0, 200)}...`);
    }

    messages.push(msg);

    // Done — no tool calls
    if (finishReason === 'stop' || !msg.tool_calls?.length) {
      console.log('\n✅ [Qwen3] Task complete.');
      return (msg.content ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    }

    // Handle tool calls
    if (finishReason === 'tool_calls') {
      for (const call of msg.tool_calls as any[]) {
        console.log(`\n🔧 [Qwen3] Calling tool: ${call.function.name}`);
        const input  = JSON.parse(call.function.arguments || '{}');
        const result = await executeTool(call.function.name, input);
        messages.push({ role: 'tool', tool_call_id: call.id, content: result });
      }
      continue;
    }

    break;
  }

  return 'Max iterations reached.';
}

// ─── Backward-compat export ──────────────────────────────────────────────────
export const runAgent = runClaudeAgent;

// ─── CLI Entry Point ──────────────────────────────────────────────────────────

async function main() {
  const args     = process.argv.slice(2);
  const useQwen  = args[0] === '--qwen';
  const taskArgs = useQwen ? args.slice(1) : args;

  const task = taskArgs.join(' ') ||
    'Viết Playwright test case TypeScript cho màn hình Login của ' +
    'https://practicetestautomation.com/practice-test-login/ ' +
    'Bao gồm: TC_LOGIN_001 login thành công, TC_LOGIN_002 sai password, ' +
    'TC_LOGIN_003 để trống username. Dùng storageState nếu cần.';

  console.log(`\n🎭 Orchestrator: ${useQwen ? 'Qwen3-32B (thinking)' : 'Claude Sonnet 4.6'}`);

  const result = useQwen ? await runQwenAgent(task) : await runClaudeAgent(task);

  console.log('\n' + '═'.repeat(60));
  console.log('📄 FINAL OUTPUT:');
  console.log('═'.repeat(60));
  console.log(result);
}

main().catch(console.error);
