/**
 * tools/playwright-ai.ts
 * VLM-powered drop-in replacement cho @zerostep/playwright's ai().
 *
 * Cách hoạt động:
 *   1. Chụp screenshot trang hiện tại
 *   2. Gửi screenshot + instruction lên Qwen2.5-VL (vision model)
 *   3. VLM trả về action JSON: { action, selector, value } hoặc { answer: true/false }
 *   4. Playwright thực thi action đó
 *
 * Usage:
 *   import { ai } from '../tools/playwright-ai';
 *   await ai('click the Create button', { page, test });
 *   const isVisible = await ai('is the dialog visible?', { page, test }); // boolean
 */

import { fetch, ProxyAgent } from 'undici';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE   = process.env.FPT_GEN_API_URL ?? process.env.FPT_API_URL ?? 'https://mkp-api.fptcloud.com';
const API_KEY    = process.env.FPT_GEN_API_KEY  ?? process.env.FPT_API_KEY ?? '';
const API_FROM   = process.env.FPT_FROM ?? '';
const PROXY_URL  = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';

const VLM_MODELS  = ['Qwen2.5-VL-7B-Instruct', 'Qwen3-VL-8B-Instruct', 'gemma-3-27b-it'];
const TEXT_MODELS = ['GLM-4.7', 'Kimi-K2.5', 'Qwen2.5-Coder-32B-Instruct'];

const dispatcher = PROXY_URL
  ? new ProxyAgent({ uri: PROXY_URL, requestTls: { rejectUnauthorized: false } })
  : undefined;

// ── Types ─────────────────────────────────────────────────────────────────────
type AiAction =
  | { action: 'click';    selector: string }
  | { action: 'fill';     selector: string; value: string }
  | { action: 'verify';   passed: boolean;  message: string }
  | { action: 'answer';   value: boolean }
  | { action: 'wait';     ms: number }
  | { action: 'scroll';   direction: 'up' | 'down' }
  | { action: 'navigate'; url: string };

// ── LLM call ──────────────────────────────────────────────────────────────────
async function callVlm(
  model: string,
  messages: Array<{ role: string; content: unknown }>,
): Promise<string> {
  const fromQ = API_FROM ? `?from=${API_FROM}` : '';
  const fetchOpts: any = {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model, messages, streaming: false, max_tokens: 512, temperature: 0.1 }),
  };
  if (dispatcher) fetchOpts.dispatcher = dispatcher;

  const res = await fetch(`${API_BASE}/v1/chat/completions${fromQ}`, fetchOpts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: any = await res.json();
  return json.choices?.[0]?.message?.content ?? '';
}

// ── Screenshot helper ─────────────────────────────────────────────────────────
async function getScreenshotBase64(page: any): Promise<string> {
  const buf = await page.screenshot({ type: 'jpeg', quality: 70 });
  return buf.toString('base64');
}

// ── Main ai() function ────────────────────────────────────────────────────────
export async function ai(
  instruction: string,
  context: { page: any; test?: any },
): Promise<boolean | void> {
  const { page } = context;
  const screenshot = await getScreenshotBase64(page);

  const isQuestion = instruction.trim().endsWith('?');
  const systemPrompt = isQuestion
    ? `You are a UI test assistant. Look at the screenshot and answer the question. Respond with JSON only: {"action":"answer","value":true|false}`
    : `You are a UI test automation assistant. Look at the screenshot and determine the best action to perform the instruction. Respond with JSON only, one of:
{"action":"click","selector":"CSS or text selector"}
{"action":"fill","selector":"CSS selector","value":"text to type"}
{"action":"navigate","url":"full URL"}
{"action":"wait","ms":1000}
{"action":"verify","passed":true|false,"message":"description"}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        { type: 'text', text: `Instruction: ${instruction}` },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${screenshot}` } },
      ],
    },
  ];

  let rawResponse = '';
  for (const model of VLM_MODELS) {
    try {
      rawResponse = await callVlm(model, messages);
      if (rawResponse) break;
    } catch { /* try next */ }
  }

  // Parse JSON from response
  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn(`⚠️  playwright-ai: no JSON in response: ${rawResponse.substring(0, 100)}`);
    return;
  }

  const action: AiAction = JSON.parse(jsonMatch[0]);
  console.log(`🤖 ai("${instruction}") → ${JSON.stringify(action)}`);

  switch (action.action) {
    case 'click':
      await page.click(action.selector);
      break;
    case 'fill':
      await page.fill(action.selector, action.value);
      break;
    case 'navigate':
      await page.goto(action.url);
      break;
    case 'wait':
      await page.waitForTimeout(action.ms);
      break;
    case 'verify':
      if (!action.passed) throw new Error(`Verification failed: ${action.message}`);
      break;
    case 'answer':
      return action.value;
    case 'scroll':
      await page.evaluate((dir: string) => window.scrollBy(0, dir === 'down' ? 400 : -400), action.direction);
      break;
  }
}
