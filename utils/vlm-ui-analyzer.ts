/**
 * vlm-ui-analyzer.ts
 *
 * Pipeline 3 bước:
 *   Step 1 — Qwen2.5-VL  : Phân tích mockup/Figma → UI components + test scenarios
 *   Step 2 — GLM/Kimi     : Generate Playwright test code từ analysis
 *   Step 3 — Playwright   : Inspect trang thật (accessibility snapshot) → GLM fix locators
 *
 * Usage:
 *   npx ts-node utils/vlm-ui-analyzer.ts <image> [desc] [--url <live_url>] [--save] [--analyze-only]
 *
 *   # Chỉ phân tích mockup
 *   npx ts-node utils/vlm-ui-analyzer.ts ./mockup.png "trang login" --analyze-only
 *
 *   # Phân tích + gen code (không có trang thật)
 *   npx ts-node utils/vlm-ui-analyzer.ts ./mockup.png "homepage" --save
 *
 *   # Full pipeline: phân tích + gen + review với trang thật
 *   npx ts-node utils/vlm-ui-analyzer.ts ./mockup.png "homepage" --url https://marketplace-stg.fptcloud.net/en --save
 *
 * Chú ý: Dùng PROD API key (FPT_GEN_API_KEY / FPT_GEN_API_URL)
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fetch, ProxyAgent } from 'undici';
import { chromium } from '@playwright/test';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const appEnv = process.env.APP_ENV ?? 'stg';
dotenv.config({ path: path.resolve(__dirname, `../.env.${appEnv}`), override: true } as any);

// ─── PROD API ─────────────────────────────────────────────────────────────────
const API_BASE = process.env.FPT_GEN_API_URL ?? 'https://mkp-api.fptcloud.com';
const API_KEY  = process.env.FPT_GEN_API_KEY ?? process.env.FPT_API_KEY!;
const API_FROM = process.env.FPT_FROM ?? '';

// ─── Proxy ────────────────────────────────────────────────────────────────────
const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://10.36.252.45:8080';
const dispatcher = new ProxyAgent({ uri: PROXY, requestTls: { rejectUnauthorized: false } });

// ─── Models ───────────────────────────────────────────────────────────────────
const VLM_MODELS  = ['Qwen2.5-VL-7B-Instruct', 'Qwen3-VL-8B-Instruct', 'gemma-3-27b-it'];
const CODE_MODELS = ['Kimi-K2.5', 'GLM-4.7', 'Qwen2.5-Coder-32B-Instruct', 'DeepSeek-V3.2-Speciale'];

// ─── FPT API call ─────────────────────────────────────────────────────────────
async function callFPT(model: string, messages: any[], maxTokens = 2048): Promise<string> {
  const fromParam = API_FROM ? `?from=${API_FROM}` : '';
  const res = await fetch(`${API_BASE}/v1/chat/completions${fromParam}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.2, streaming: false }),
    dispatcher,
  } as any);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).substring(0, 150)}`);
  const json: any = await res.json();
  const content = json.choices?.[0]?.message?.content ?? '';
  if (!content) throw new Error('Empty response');
  const u = json.usage ?? {};
  console.log(`   tokens — prompt: ${u.prompt_tokens ?? '?'}, completion: ${u.completion_tokens ?? '?'}`);
  return content;
}

async function callWithFallback(
  models: string[], messages: any[], maxTokens: number,
): Promise<{ content: string; model: string }> {
  for (const model of models) {
    try {
      console.log(`\n🤖 [${model}]`);
      const content = await callFPT(model, messages, maxTokens);
      console.log(`✅ Done — ${content.length} chars`);
      return { content, model };
    } catch (err: any) {
      console.warn(`⚠️  Failed (${err.message.match(/HTTP (\d+)/)?.[1] ?? '?'}) — next...`);
    }
  }
  throw new Error('All models failed.');
}

// ─── Step 1: VLM phân tích mockup ────────────────────────────────────────────
function buildImageContent(input: string) {
  if (input.startsWith('http')) return { type: 'image_url', image_url: { url: input } };
  const ext = path.extname(input).toLowerCase();
  const mime: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
  const b64 = fs.readFileSync(input).toString('base64');
  return { type: 'image_url', image_url: { url: `data:${mime[ext] ?? 'image/png'};base64,${b64}` } };
}

async function analyzeUI(imageInput: string, featureDesc: string): Promise<string> {
  console.log('\n🔍 [Step 1] VLM phân tích UI mockup...');
  const { content } = await callWithFallback(VLM_MODELS, [{
    role: 'system',
    content: 'You are a senior QA engineer. Analyze the UI screenshot and output:\n## UI Components\n## User Interactions\n## Suggested Test Scenarios (TC_001, TC_002...)\n## Locator Hints (element: visible text/label)',
  }, {
    role: 'user',
    content: [
      { type: 'text', text: `Analyze this UI mockup. Feature: "${featureDesc || 'unknown'}". Extract all components, interactions, test scenarios and locator hints.` },
      buildImageContent(imageInput),
    ],
  }], 1500);
  return content;
}

// ─── Step 2: GLM generate initial code ───────────────────────────────────────
const TEST_CONTEXT = `
## Project config
- import { config } from '../../utils/config'  →  config.baseUrl, config.fptApiUrl
- storageState: playwright/.auth/stg-user.json
- File: import { test, expect } from '@playwright/test'

## Proven locators (STG)
- getByRole('tab', { name: 'Large Language Model' })
- getByRole('link').filter({ hasText: 'model name' }).first()
- getByRole('button', { name: /text/i })
- getByPlaceholder(/placeholder/i)
- locator('.ant-select-selector').first() for Ant Design dropdowns
`.trim();

async function generateInitialCode(uiAnalysis: string, featureDesc: string): Promise<{ code: string; model: string }> {
  console.log('\n⚙️  [Step 2] GLM generate initial test code...');
  const prompt = `Based on this UI analysis, generate Playwright TypeScript test cases.

## UI Analysis:
${uiAnalysis}

## Feature: ${featureDesc || 'UI feature'}

## Project context:
${TEST_CONTEXT}

Rules:
- Output ONLY valid TypeScript code, no markdown fences, no explanations
- Use TC_UI_001, TC_UI_002 numbering
- Use getByText/getByRole/getByPlaceholder as primary locators (NOT getByTestId — app has no data-testid)
- Mark uncertain locators with comment: // TODO: verify locator
- Add beforeEach with page.goto(config.baseUrl)`;

  const { content: raw, model } = await callWithFallback(CODE_MODELS, [{
    role: 'system',
    content: 'You are an expert TypeScript/Playwright test engineer. Output ONLY valid TypeScript code. No markdown, no explanations.',
  }, { role: 'user', content: prompt }], 3000);

  const code = raw.replace(/^```(?:typescript|ts)?\n?/m, '').replace(/\n?```\s*$/m, '').trim();
  return { code, model };
}

// ─── Step 3: Browser inspect → GLM fix locators ───────────────────────────────
async function inspectLivePage(url: string, authFile?: string): Promise<string> {
  console.log(`\n🌐 [Step 3] Browser inspect: ${url}`);
  const browser = await chromium.launch({
    headless: true,
    proxy: { server: PROXY },
  });
  const contextOptions: any = { ignoreHTTPSErrors: true };
  if (authFile && fs.existsSync(authFile)) contextOptions.storageState = authFile;
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000); // chờ JS render

    // Lấy accessibility snapshot qua evaluate (page.accessibility deprecated in newer Playwright)
    const snapshotStr = await page.evaluate(() => {
      function walk(node: Element, depth: number): object {
        const role = node.getAttribute('role') || node.tagName.toLowerCase();
        const label = node.getAttribute('aria-label') || node.getAttribute('placeholder')
          || node.getAttribute('name') || (node as HTMLElement).innerText?.trim().substring(0, 60) || '';
        const children: object[] = [];
        for (const child of Array.from(node.children).slice(0, 10)) {
          if (depth < 5) children.push(walk(child, depth + 1));
        }
        return children.length ? { role, label, children } : { role, label };
      }
      return JSON.stringify(walk(document.body, 0), null, 2);
    });

    // Cắt bớt nếu quá dài (max 8000 chars để fit trong prompt)
    const trimmed = snapshotStr.length > 8000
      ? snapshotStr.substring(0, 8000) + '\n... (truncated)'
      : snapshotStr;

    console.log(`   Snapshot: ${snapshotStr.length} chars → trimmed to ${trimmed.length} chars`);
    await browser.close();
    return trimmed;
  } catch (err: any) {
    await browser.close();
    throw new Error(`Browser inspect failed: ${err.message}`);
  }
}

async function reviewAndFixCode(
  roughCode: string,
  domSnapshot: string,
): Promise<{ code: string; model: string }> {
  console.log('\n🔧 [Step 3b] GLM fix locators based on real DOM...');
  const prompt = `You are reviewing Playwright test code. Fix all locators based on the real DOM snapshot.

## Real DOM Snapshot (from live page):
${domSnapshot}

## Rough test code (locators may be wrong):
${roughCode}

## Rules:
- Output ONLY the corrected TypeScript code, no markdown, no explanations
- Replace getByTestId() with actual locators from the DOM snapshot
- Use getByRole, getByText, getByPlaceholder based on what's in the snapshot
- Keep test logic and assertions, only fix locators
- Add comment "// VERIFIED via DOM snapshot" on corrected lines`;

  const { content: raw, model } = await callWithFallback(CODE_MODELS, [{
    role: 'system',
    content: 'You are an expert Playwright test engineer. Fix test locators based on real DOM. Output ONLY valid TypeScript code.',
  }, { role: 'user', content: prompt }], 3000);

  const code = raw.replace(/^```(?:typescript|ts)?\n?/m, '').replace(/\n?```\s*$/m, '').trim();
  return { code, model };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const analyzeOnly = args.includes('--analyze-only');
  const saveFlag    = args.includes('--save');
  const urlIdx      = args.indexOf('--url');
  const reviewUrl   = urlIdx !== -1 ? args[urlIdx + 1] : undefined;
  const cleanArgs   = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--url' && a !== reviewUrl);

  const imageInput  = cleanArgs[0];
  const featureDesc = cleanArgs.slice(1).join(' ');

  if (!imageInput) {
    console.error('Usage: npx ts-node utils/vlm-ui-analyzer.ts <image> [desc] [--url <url>] [--save] [--analyze-only]');
    process.exit(1);
  }
  if (!imageInput.startsWith('http') && !fs.existsSync(imageInput)) {
    console.error(`❌ File not found: ${imageInput}`);
    process.exit(1);
  }

  console.log('\n📸 Image :', imageInput);
  console.log('📋 Feature:', featureDesc || '(not specified)');
  if (reviewUrl) console.log('🌐 Review :', reviewUrl);
  console.log('─'.repeat(60));

  // Step 1: VLM analyze
  const uiAnalysis = await analyzeUI(imageInput, featureDesc);
  console.log('\n' + '═'.repeat(60));
  console.log('🔍 UI ANALYSIS:');
  console.log('═'.repeat(60));
  console.log(uiAnalysis);

  if (analyzeOnly) return;

  // Step 2: Generate initial code
  const { code: roughCode, model: genModel } = await generateInitialCode(uiAnalysis, featureDesc);
  console.log('\n' + '═'.repeat(60));
  console.log(`📄 INITIAL CODE (by ${genModel}):`);
  console.log('═'.repeat(60));
  console.log(roughCode);

  let finalCode = roughCode;
  let finalModel = genModel;

  // Step 3: Browser review (nếu có --url)
  if (reviewUrl) {
    const authFile = path.resolve(__dirname, `../playwright/.auth/${appEnv}-user.json`);
    const domSnapshot = await inspectLivePage(reviewUrl, authFile);

    const { code: fixedCode, model: fixModel } = await reviewAndFixCode(roughCode, domSnapshot);
    finalCode = fixedCode;
    finalModel = `${genModel} → reviewed by ${fixModel}`;

    console.log('\n' + '═'.repeat(60));
    console.log(`✅ FINAL CODE (after DOM review by ${fixModel}):`);
    console.log('═'.repeat(60));
    console.log(finalCode);
  }

  // Save
  if (saveFlag) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const outFile = path.resolve(__dirname, `../tests/regression/vlm-generated-${timestamp}.spec.ts`);
    const header =
      `// AUTO-GENERATED by vlm-ui-analyzer.ts\n` +
      `// Pipeline: ${VLM_MODELS[0]} → ${finalModel}\n` +
      `// Date: ${new Date().toISOString()}\n` +
      `// Image: ${imageInput}${reviewUrl ? '\n// Review URL: ' + reviewUrl : ''}\n` +
      `// Feature: ${featureDesc || 'UI feature'}\n\n`;
    fs.writeFileSync(outFile, header + finalCode, 'utf-8');
    console.log(`\n💾 Saved to: ${outFile}`);
  }
}

main().catch(err => { console.error('\n❌ Error:', err.message); process.exit(1); });
