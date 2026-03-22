/**
 * fpt-agent.ts
 * Shared FPT Cloud AI client — drop-in helper for orchestration tasks.
 *
 * Exports:
 *   // Low-level (undici, proxy-aware)
 *   CODE_MODELS          — fallback chain for code generation
 *   getDispatcher()      — ProxyAgent or plain Agent based on env
 *   callFptModel()       — single model call
 *   callFptWithFallback() — tries CODE_MODELS in order until one succeeds
 *
 *   // High-level (OpenAI SDK)
 *   qwen3Orchestrate, fptChat, fptAgentLoop
 */
import dotenv from 'dotenv';
import path from 'path';
import OpenAI from 'openai';
import { fetch, ProxyAgent, Agent } from 'undici';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── Shared low-level infra ───────────────────────────────────────────────────

/** Fallback chain for code/test generation (PROD API). */
export const CODE_MODELS = [
  'Kimi-K2.5',                     // primary: reasoning + 256K context
  'GLM-4.7',                       // backup 1
  'Qwen2.5-Coder-32B-Instruct',    // backup 2: code specialist
  'DeepSeek-V3.2-Speciale',        // backup 3: general + code
];

/** Returns a proxy-aware undici dispatcher (reads HTTPS_PROXY / HTTP_PROXY). */
export function getDispatcher(): ProxyAgent | Agent {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
  return proxyUrl
    ? new ProxyAgent({ uri: proxyUrl, requestTls: { rejectUnauthorized: false } })
    : new Agent();
}

/**
 * Call a single FPT model via undici fetch (proxy-aware).
 * Uses FPT_GEN_API_URL/KEY for code generation; falls back to FPT_API_URL/KEY.
 */
export async function callFptModel(
  model: string,
  messages: Array<{ role: string; content: string }>,
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<{ content: string; usage: Record<string, number> }> {
  const apiBase = process.env.FPT_GEN_API_URL ?? process.env.FPT_API_URL ?? 'https://mkp-api.fptcloud.com';
  const apiKey  = process.env.FPT_GEN_API_KEY  ?? process.env.FPT_API_KEY!;
  const from    = process.env.FPT_FROM ?? '';
  const fromQ   = from ? `?from=${from}` : '';

  const res = await fetch(`${apiBase}/v1/chat/completions${fromQ}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.2,
      max_tokens:  opts.maxTokens  ?? 3000,
      streaming:   false,
    }),
    dispatcher: getDispatcher(),
  } as any);

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).substring(0, 200)}`);
  const json: any = await res.json();
  const content = json.choices?.[0]?.message?.content
                ?? json.choices?.[0]?.message?.reasoning_content
                ?? '';
  if (!content) throw new Error('Empty response');
  return { content, usage: json.usage ?? {} };
}

/**
 * Try CODE_MODELS in order, return the first successful result.
 * Pass `opts.models` to override the fallback chain.
 */
export async function callFptWithFallback(
  messages: Array<{ role: string; content: string }>,
  opts: { maxTokens?: number; temperature?: number; models?: string[] } = {},
): Promise<{ content: string; model: string }> {
  const chain = opts.models ?? CODE_MODELS;
  for (const model of chain) {
    try {
      console.log(`\n🤖 [${model}] Generating...`);
      const { content, usage } = await callFptModel(model, messages, opts);
      console.log(`✅ [${model}] Done — ${content.length} chars | tokens: ${usage['prompt_tokens'] ?? '?'}+${usage['completion_tokens'] ?? '?'}`);
      return { content, model };
    } catch (err: any) {
      console.warn(`⚠️  [${model}] Failed — ${err.message.substring(0, 80)} — trying next...`);
    }
  }
  throw new Error('All models in fallback chain failed.');
}

// ─── High-level OpenAI SDK client ────────────────────────────────────────────

const client = new OpenAI({
  apiKey: process.env.FPT_API_KEY!,
  baseURL: process.env.FPT_API_URL || 'https://mkp-api.fptcloud.com/v1',
});

export type FptModel =
  | 'Qwen3-32B'
  | 'gpt-oss-120b'
  | 'gpt-oss-20b'
  | 'gemma-3-27b-it'
  | 'Kimi-K2.5';

/**
 * Qwen3-32B with thinking mode — best for orchestration, planning, tool use.
 */
export async function qwen3Orchestrate(
  systemPrompt: string,
  userMessage: string,
  tools?: OpenAI.ChatCompletionTool[],
): Promise<OpenAI.ChatCompletionMessage> {
  const res = await client.chat.completions.create({
    model: 'Qwen3-32B',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    ...(tools?.length ? { tools } : {}),
    // Qwen3 thinking mode
    ...({ extra_body: { chat_template_kwargs: { thinking: true } } } as any),
  });
  return res.choices[0].message;
}

/**
 * Generic FPT chat — choose any model, returns text content directly.
 */
export async function fptChat(
  model: FptModel,
  systemPrompt: string,
  userMessage: string,
  options?: Partial<OpenAI.ChatCompletionCreateParamsNonStreaming>,
): Promise<string> {
  const res = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    ...options,
  });
  return res.choices[0].message.content ?? '';
}

/**
 * Agentic tool-call loop — model keeps calling tools until it returns a final answer.
 * Pass `executeTool` to handle each tool_call and return its result string.
 *
 * Example:
 *   const answer = await fptAgentLoop('Qwen3-32B', system, user, tools, async (name, args) => {
 *     if (name === 'search') return doSearch(args.query);
 *     return 'unknown tool';
 *   });
 */
export async function fptAgentLoop(
  model: FptModel,
  systemPrompt: string,
  userMessage: string,
  tools: OpenAI.ChatCompletionTool[],
  executeTool: (name: string, args: Record<string, any>) => Promise<string>,
  maxIterations = 10,
): Promise<string> {
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  for (let i = 0; i < maxIterations; i++) {
    const res = await client.chat.completions.create({ model, messages, tools });
    const msg = res.choices[0].message;
    messages.push(msg);

    if (!msg.tool_calls?.length) {
      return msg.content ?? '';
    }

    for (const call of msg.tool_calls as any[]) {
      const args = JSON.parse(call.function.arguments || '{}');
      const result = await executeTool(call.function.name, args);
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: result,
      });
    }
  }

  throw new Error(`fptAgentLoop: exceeded ${maxIterations} iterations`);
}
