/**
 * glm-direct.ts
 *
 * GLM-4.7 (FPT API) trực tiếp generate Playwright test code — không cần Claude.
 * Fallback chain: GLM-4.7 → Qwen2.5-Coder-32B → Kimi-K2.5 → DeepSeek-V3.2-Speciale
 *
 * Usage:
 *   npx ts-node utils/glm-direct.ts "Viết TC_NEMOTRON_007 test stream..."
 *   npx ts-node utils/glm-direct.ts --save "Viết test..."   # save ra file
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fetch, ProxyAgent } from 'undici';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Also load APP_ENV-specific overrides
const appEnv = process.env.APP_ENV ?? 'stg';
dotenv.config({ path: path.resolve(__dirname, `../.env.${appEnv}`), override: true } as any);

// glm-direct uses PROD API for code generation (GLM-4.7 not on STG)
// but reads BASE_URL / auth from APP_ENV for test context.
const API_BASE = process.env.FPT_GEN_API_URL  // explicit override
  ?? 'https://mkp-api.fptcloud.com';           // default: PROD
const API_KEY  = process.env.FPT_GEN_API_KEY  // explicit override
  ?? process.env.FPT_API_KEY!;                 // fallback: env key
const API_FROM = process.env.FPT_FROM ?? '';

// ─── Proxy (corporate network) ───────────────────────────────────────────────
const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://10.36.252.45:8080';
const dispatcher = new ProxyAgent({ uri: PROXY, requestTls: { rejectUnauthorized: false } });

// ─── Models fallback chain (PROD API) ────────────────────────────────────────
const CODE_MODELS = [
  'Kimi-K2.5',
  'GLM-4.7',
  'Qwen2.5-Coder-32B-Instruct',
  'DeepSeek-V3.2-Speciale',
];

const SYSTEM_PROMPT =
  'You are an expert TypeScript/Playwright test engineer for FPT AI Marketplace. ' +
  'Generate clean, production-ready Playwright test code. ' +
  'Output ONLY valid TypeScript code — no markdown fences, no explanations, no preamble.';

// ─── Playwright test context (injected into prompt) ───────────────────────────
const TEST_CONTEXT = `
## Project config
- BASE_URL (STG): https://marketplace-stg.fptcloud.net/en
- FPT_API_URL (STG): https://mkp-api-stg.fptcloud.net
- storageState: playwright/.auth/stg-user.json
- import config from: utils/config.ts  →  config.baseUrl, config.fptApiUrl, config.fptApiKey

## Proven Playwright locators (STG)
- Model card: page.getByRole('link').filter({ hasText: MODEL_API_ID }).first()
- Search input: page.locator('input[placeholder*="search" i], input[type="search"]').first()
- Ant Design select: page.locator('.ant-select-selector').first()  →  fill search  →  click option
- Chat input: page.getByPlaceholder(/type a message/i)
- Send button: page.locator('button:has(img[alt="send"]), button[aria-label*="send" i], button:has(.anticon-send)').last()
- AI response area: page.locator('.prose').last()
- View Code modal: page.getByRole('dialog').filter({ hasText: 'View Code' })

## React controlled input trick (required for send button to enable)
await page.evaluate((text) => {
  const el = document.querySelector('textarea[placeholder*="message" i]') as HTMLTextAreaElement;
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  if (setter) setter.call(el, text);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}, message);

## Existing test file structure (follow this pattern)
import { test, expect } from '@playwright/test';
import { config } from '../../utils/config';

const MODEL_NAME   = 'Nemotron';
const MODEL_API_ID = 'Nemotron-3-Super-120B-A12B';

test.use({ storageState: 'playwright/.auth/stg-user.json' });

test.describe('Nemotron — Regression STG', () => {
  test('TC_NEMOTRON_001 — Model card visible', async ({ page }) => { ... });
});
`.trim();

// ─── Call a single FPT model ──────────────────────────────────────────────────
async function callModel(model: string, task: string): Promise<string> {
  const fromParam = API_FROM ? `?from=${API_FROM}` : '';
  const url = `${API_BASE}/v1/chat/completions${fromParam}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `${TEST_CONTEXT}\n\n## Task\n${task}` },
      ],
      temperature: 0.2,
      max_tokens: 3000,
      streaming: false,
    }),
    dispatcher,
  } as any);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.substring(0, 200)}`);
  }

  const json: any = await res.json();
  const content = json.choices?.[0]?.message?.content ?? '';
  if (!content) throw new Error('Empty response from model');

  const usage = json.usage ?? {};
  console.log(`   tokens — prompt: ${usage.prompt_tokens ?? '?'}, completion: ${usage.completion_tokens ?? '?'}`);

  return content;
}

// ─── Fallback chain ────────────────────────────────────────────────────────────
async function generateCode(task: string): Promise<{ code: string; model: string }> {
  for (const model of CODE_MODELS) {
    try {
      console.log(`\n🤖 [${model}] Generating...`);
      const code = await callModel(model, task);
      console.log(`✅ [${model}] Done — ${code.length} chars`);
      return { code, model };
    } catch (err: any) {
      const status = err?.message?.match(/HTTP (\d+)/)?.[1] ?? '?';
      console.warn(`⚠️  [${model}] Failed (${status}) — trying next...`);
    }
  }
  throw new Error('All models in fallback chain failed.');
}

// ─── Strip markdown fences if model added them anyway ─────────────────────────
function stripMarkdown(code: string): string {
  return code
    .replace(/^```(?:typescript|ts)?\n?/m, '')
    .replace(/\n?```\s*$/m, '')
    .trim();
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const saveFlag = args.includes('--save');
  const taskArgs = args.filter(a => a !== '--save');

  const task = taskArgs.join(' ') ||
    'Viết TC_NEMOTRON_007 kiểm tra streaming response từ Nemotron-3-Super-120B-A12B qua FPT API. ' +
    'Gọi /v1/chat/completions với stream=true, verify response có SSE chunks (data: {...}), ' +
    'verify từng chunk có delta.content, verify response kết thúc bằng data: [DONE].';

  console.log('\n📋 Task:', task);
  console.log('─'.repeat(60));

  const { code: raw, model } = await generateCode(task);
  const code = stripMarkdown(raw);

  console.log('\n' + '═'.repeat(60));
  console.log(`📄 GENERATED BY ${model}:`);
  console.log('═'.repeat(60));
  console.log(code);

  if (saveFlag) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const outFile = path.resolve(__dirname, `../tests/regression/glm-generated-${timestamp}.spec.ts`);
    const header =
      `// AUTO-GENERATED by glm-direct.ts using ${model}\n` +
      `// Date: ${new Date().toISOString()}\n` +
      `// Task: ${task.substring(0, 100)}\n\n`;
    fs.writeFileSync(outFile, header + code, 'utf-8');
    console.log(`\n💾 Saved to: ${outFile}`);
  }
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
