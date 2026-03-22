/**
 * glm-direct.ts
 *
 * Generate Playwright test code via FPT fallback chain — no Claude needed.
 *
 * Modes:
 *   Default — task description → any test code (saves to tests/regression/)
 *   --api-models <ModelA> <ModelB> → API test cases (saves to tests/api/api-generated.spec.ts)
 *
 * Usage:
 *   npx ts-node utils/glm-direct.ts "Viết TC_007 test stream..."
 *   npx ts-node utils/glm-direct.ts --save "Viết test..."
 *   npx ts-node utils/glm-direct.ts --api-models "Qwen3-VL-72B" "GLM-Z1-Air"
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { callFptWithFallback } from './fpt-agent';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const appEnv = process.env.APP_ENV ?? 'stg';
dotenv.config({ path: path.resolve(__dirname, `../.env.${appEnv}`), override: true } as any);

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT =
  'You are an expert TypeScript/Playwright test engineer for FPT AI Marketplace. ' +
  'Generate clean, production-ready Playwright test code. ' +
  'Output ONLY valid TypeScript code — no markdown fences, no explanations, no preamble.';

// ─── Playwright project context (injected into every prompt) ──────────────────

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

// ─── API test mode (merged from glm-generate-tests.ts) ───────────────────────

const ALREADY_TESTED = [
  'DeepSeek-V3.2-Speciale', 'GLM-4.5', 'GLM-4.7', 'gpt-oss-120b', 'gpt-oss-20b',
  'Qwen2.5-Coder-32B-Instruct', 'Qwen3-32B', 'Qwen3-Coder-480B-A35B-Instruct',
  'gemma-3-27b-it', 'SaoLa3.1-medium', 'SaoLa-Llama3.1-planner',
  'Llama-3.3-70B-Instruct', 'Llama-3.3-Swallow-70B-Instruct-v0.4',
  'Kimi-K2.5', 'SaoLa4-medium', 'SaoLa4-small',
  'Qwen3-VL-8B-Instruct', 'Qwen2.5-VL-7B-Instruct',
  'DeepSeek-OCR', 'FPT.AI-Table-Parsing-v1.1', 'FPT.AI-KIE-v1.7',
  'Nemotron-3-Super-120B-A12B', 'Alpamayo-R1-10B',
];

const API_TEST_PATTERN = `
function chatUrl(model: string) {
  return \`\${BASE}/v1/chat/completions?from=\${FROM}&model=\${model}\`;
}
function chatBody(model: string, content: string, extra: object = {}) {
  return { model, messages: [{ role: 'user', content }], streaming: false,
    temperature: 1, max_tokens: 512, top_p: 1, top_k: 40,
    presence_penalty: 0, frequency_penalty: 0, ...extra };
}
async function assertChat(res: any, model: string) {
  expect(res.status(), \`\${model} should return 200\`).toBe(200);
  const body = await res.json();
  expect(body).toHaveProperty('choices');
  const content = body.choices[0].message?.content ?? '';
  expect(content.length).toBeGreaterThan(0);
}

const MSG_SHORT  = 'Hi, what is your name and version?';
const MSG_FAMILY = "Hi! My name is Ethan, I'm 7. My family: father (engineer, 40), mother (teacher, 37), baby sister Lisa (2).";

// Text model example:
test('TC_API_003 — GLM-4.7', async ({ request }) => {
  const res = await request.post(chatUrl('GLM-4.7'), { headers: HEADERS, data: chatBody('GLM-4.7', MSG_FAMILY) });
  await assertChat(res, 'GLM-4.7');
});

// Vision model example:
test('TC_API_020 — DeepSeek-OCR', async ({ request }) => {
  const res = await request.post(chatUrl('DeepSeek-OCR'), { headers: HEADERS, data: {
    model: 'DeepSeek-OCR',
    messages: [{ role: 'user', content: [
      { type: 'text', text: 'What is this a picture of?' },
      { type: 'image_url', image_url: { url: 'https://raw.githubusercontent.com/open-mmlab/mmdeploy/main/demo/resources/det.jpg' } },
    ]}],
    streaming: false, temperature: 1, max_tokens: 512,
  }});
  await assertChat(res, 'DeepSeek-OCR');
});
`.trim();

const API_FILE_HEADER = (models: string[], generatedBy: string) =>
  `// AUTO-GENERATED by glm-direct.ts --api-models using ${generatedBy}\n` +
  `// Date: ${new Date().toISOString()}\n` +
  `// Models: ${models.join(', ')}\n` +
  `import { test, expect } from '@playwright/test';\n` +
  `import dotenv from 'dotenv';\n` +
  `dotenv.config();\n\n` +
  `const BASE    = process.env.FPT_API_URL!;\n` +
  `const KEY     = process.env.FPT_API_KEY!;\n` +
  `const FROM    = process.env.FPT_FROM!;\n` +
  `const HEADERS = { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${KEY}\` };\n\n`;

function buildApiModelsPrompt(models: string[]): string {
  return `You are a senior QA engineer writing Playwright TypeScript API tests for FPT AI Marketplace.

## Existing test pattern (follow exactly):
\`\`\`typescript
${API_TEST_PATTERN}
\`\`\`

## Models already covered: ${ALREADY_TESTED.join(', ')}

## Task:
Generate Playwright test cases for these NEW models: **${models.join(', ')}**

Rules:
1. Use TC_API_100+ numbering (increment for each test)
2. Text-only models → use MSG_FAMILY or MSG_SHORT
3. Vision/multimodal models → use image_url pattern (use the Det.jpg URL from example)
4. Wrap all tests in: test.describe('Chat Completions — Generated', () => { ... })
5. Output ONLY valid TypeScript code — no markdown fences, no explanations`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripMarkdown(code: string): string {
  return code
    .replace(/^```(?:typescript|ts)?\n?/m, '')
    .replace(/\n?```\s*$/m, '')
    .trim();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // ── Mode: --api-models ModelA ModelB ────────────────────────────────────────
  if (args[0] === '--api-models') {
    const models = args.slice(1);
    if (!models.length) {
      console.error('Usage: glm-direct.ts --api-models "ModelA" "ModelB"');
      process.exit(1);
    }

    console.log(`\n📋 Generating API tests for: ${models.join(', ')}`);
    console.log('─'.repeat(60));

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: buildApiModelsPrompt(models) },
    ];

    const { content: raw, model } = await callFptWithFallback(messages, { maxTokens: 2048, temperature: 0.2 });
    const code = stripMarkdown(raw);

    const outFile = path.resolve(__dirname, '../tests/api/api-generated.spec.ts');
    fs.writeFileSync(outFile, API_FILE_HEADER(models, model) + code, 'utf-8');
    console.log(`\n💾 Saved to: ${outFile}`);
    return;
  }

  // ── Mode: default task description ──────────────────────────────────────────
  const saveFlag = args.includes('--save');
  const taskArgs = args.filter(a => a !== '--save');

  const task = taskArgs.join(' ') ||
    'Viết TC_NEMOTRON_007 kiểm tra streaming response từ Nemotron-3-Super-120B-A12B qua FPT API. ' +
    'Gọi /v1/chat/completions với stream=true, verify response có SSE chunks (data: {...}), ' +
    'verify từng chunk có delta.content, verify response kết thúc bằng data: [DONE].';

  console.log('\n📋 Task:', task);
  console.log('─'.repeat(60));

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user',   content: `${TEST_CONTEXT}\n\n## Task\n${task}` },
  ];

  const { content: raw, model } = await callFptWithFallback(messages, { maxTokens: 3000, temperature: 0.2 });
  const code = stripMarkdown(raw);

  console.log('\n' + '═'.repeat(60));
  console.log(`📄 GENERATED BY ${model}:`);
  console.log('═'.repeat(60));
  console.log(code);

  if (saveFlag) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const outFile   = path.resolve(__dirname, `../tests/regression/glm-generated-${timestamp}.spec.ts`);
    const header    =
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
