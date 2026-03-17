/**
 * fpt-agent.ts
 * Shared FPT Cloud AI client — drop-in helper for orchestration tasks.
 *
 * Usage:
 *   import { qwen3Orchestrate, fptChat } from './fpt-agent';
 */
import dotenv from 'dotenv';
import path from 'path';
import OpenAI from 'openai';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

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
    extra_body: { chat_template_kwargs: { thinking: true } } as any,
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

    for (const call of msg.tool_calls) {
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
