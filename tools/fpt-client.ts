/**
 * tools/fpt-client.ts
 * FPT Cloud AI — low-level proxy-aware client + high-level OpenAI SDK helper.
 *
 * Exports:
 *   CODE_MODELS          — fallback chain for code/test generation
 *   getDispatcher()      — ProxyAgent | Agent (reads HTTPS_PROXY / HTTP_PROXY)
 *   callFptModel()       — single model call via undici fetch
 *   callFptWithFallback() — tries CODE_MODELS in order until one succeeds
 *   fptChat()            — high-level chat via OpenAI SDK
 *   fptAgentLoop()       — multi-turn tool-use loop via OpenAI SDK
 */

import dotenv from 'dotenv';
import path from 'path';
import OpenAI from 'openai';
import { fetch, ProxyAgent, Agent } from 'undici';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── Fallback chain ───────────────────────────────────────────────────────────

export const CODE_MODELS = [
  'Kimi-K2.5',                     // primary: reasoning + 256K context
  'GLM-4.7',                       // backup 1
  'Qwen2.5-Coder-32B-Instruct',    // backup 2: code specialist
  'DeepSeek-V3.2-Speciale',        // backup 3: general + code
];

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export function getDispatcher(): ProxyAgent | Agent {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
  return proxyUrl
    ? new ProxyAgent({ uri: proxyUrl, requestTls: { rejectUnauthorized: false } })
    : new Agent();
}

// ─── Low-level: single model call ─────────────────────────────────────────────

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

// ─── Low-level: fallback chain ────────────────────────────────────────────────

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

// ─── High-level: OpenAI SDK client ───────────────────────────────────────────

export type FptModel =
  | 'Qwen3-32B' | 'gpt-oss-120b' | 'gpt-oss-20b'
  | 'GLM-4.7'   | 'Kimi-K2.5'    | 'Qwen2.5-Coder-32B-Instruct'
  | 'gemma-3-27b-it' | 'DeepSeek-V3.2-Speciale' | 'Nemotron-3-Super-120B-A12B'
  | (string & {});

function makeFptClient() {
  return new OpenAI({
    apiKey:  process.env.FPT_API_KEY!,
    baseURL: `${process.env.FPT_API_URL ?? 'https://mkp-api.fptcloud.com'}/v1`,
    fetchOptions: { dispatcher: getDispatcher() } as any,
  });
}

export async function fptChat(
  model: FptModel,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  const client = makeFptClient();
  const res = await client.chat.completions.create({
    model,
    messages,
    max_tokens:  opts.maxTokens  ?? 2048,
    temperature: opts.temperature ?? 0.3,
  } as any);
  return res.choices[0]?.message?.content ?? '';
}

export async function fptAgentLoop(
  model: FptModel,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  tools: OpenAI.Chat.ChatCompletionTool[],
  onToolCall: (name: string, args: unknown) => Promise<string>,
  opts: { maxTokens?: number; maxIterations?: number } = {},
): Promise<string> {
  const client = makeFptClient();
  const history = [...messages];
  const maxIter = opts.maxIterations ?? 10;

  for (let i = 0; i < maxIter; i++) {
    const res = await client.chat.completions.create({
      model,
      messages: history,
      tools,
      max_tokens: opts.maxTokens ?? 2048,
    } as any);

    const msg = res.choices[0].message;
    history.push(msg as any);

    if (res.choices[0].finish_reason !== 'tool_calls' || !msg.tool_calls?.length) {
      return msg.content ?? '';
    }

    for (const call of msg.tool_calls as any[]) {
      const result = await onToolCall(call.function.name, JSON.parse(call.function.arguments));
      history.push({ role: 'tool', tool_call_id: call.id, content: result } as any);
    }
  }

  return '[max iterations reached]';
}
