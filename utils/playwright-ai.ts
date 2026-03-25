/**
 * utils/playwright-ai.ts
 * Drop-in replacement cho @zerostep/playwright's ai() — dùng FPT AI (không cần ZeroStep).
 *
 * Cách hoạt động:
 *   1. Chụp screenshot trang hiện tại
 *   2. Gửi screenshot + instruction lên Qwen2.5-VL (vision model)
 *   3. VLM trả về action JSON: { action, selector, value } hoặc { answer: true/false }
 *   4. Playwright thực thi action đó
 *
 * Usage (thay thế @zerostep/playwright):
 *   import { ai } from '../utils/playwright-ai';
 *   await ai('click the Create button', { page, test });
 *   const result = await ai('is the dialog visible?', { page, test }); // returns boolean
 */

import { fetch, ProxyAgent } from 'undici';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE   = process.env.FPT_GEN_API_URL ?? process.env.FPT_API_URL ?? 'https://mkp-api.fptcloud.com';
const API_KEY    = process.env.FPT_GEN_API_KEY  ?? process.env.FPT_API_KEY ?? '';
const API_FROM   = process.env.FPT_FROM ?? '';
const PROXY_URL  = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://10.36.252.45:8080';

const VLM_MODELS  = ['Qwen2.5-VL-7B-Instruct', 'Qwen3-VL-8B-Instruct', 'gemma-3-27b-it'];
const TEXT_MODELS = ['GLM-4.7', 'Kimi-K2.5', 'Qwen2.5-Coder-32B-Instruct'];

const dispatcher = new ProxyAgent({ uri: PROXY_URL, requestTls: { rejectUnauthorized: false } });

// ── Types ─────────────────────────────────────────────────────────────────────
type AiAction =
  | { action: 'click';    selector: string }
  | { action: 'fill';     selector: string; value: string }
  | { action: 'verify';   passed: boolean;  message: string }
  | { action: 'answer';   value: boolean }
  | { action: 'wait';     ms: number }
  | { action: 'none' };

// ── FPT API call ──────────────────────────────────────────────────────────────
async function callFPT(model: string, messages: any[], maxTokens = 1024): Promise<string> {
  const fromParam = API_FROM ? `?from=${API_FROM}` : '';
  const res = await fetch(`${API_BASE}/v1/chat/completions${fromParam}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model, messages, temperature: 0.1, max_tokens: maxTokens }),
    dispatcher,
  } as any);
  if (!res.ok) throw new Error(`[${model}] HTTP ${res.status}`);
  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content ?? '';
}

async function callWithFallback(models: string[], messages: any[]): Promise<string> {
  for (const model of models) {
    try {
      return await callFPT(model, messages);
    } catch {
      /* try next */
    }
  }
  throw new Error('All AI models failed');
}

// ── Screenshot helper ─────────────────────────────────────────────────────────
async function takeScreenshot(page: any): Promise<string> {
  const buf: Buffer = await page.screenshot({ type: 'png', fullPage: false });
  return buf.toString('base64');
}

// ── Get accessibility snapshot — trả về ARIA tree để AI biết đúng selectors ──
async function getSnapshot(page: any): Promise<string> {
  try {
    // Lấy accessibility tree: role + name + selector hints
    const snapshot = await page.evaluate(() => {
      const results: string[] = [];
      const walk = (el: Element, depth = 0) => {
        if (depth > 6) return;
        const role  = el.getAttribute('role') || el.tagName.toLowerCase();
        const text  = (el as HTMLElement).innerText?.trim().substring(0, 60) ?? '';
        const aria  = el.getAttribute('aria-label') ?? '';
        const ph    = (el as HTMLInputElement).placeholder ?? '';
        const id    = el.id ? `#${el.id}` : '';
        const cls   = el.className ? `.${String(el.className).split(' ')[0]}` : '';
        const tag   = el.tagName.toLowerCase();
        if (text || aria || ph) {
          results.push(`${'  '.repeat(depth)}<${tag}${id}${cls} role="${role}"${aria ? ` aria="${aria}"` : ''}${ph ? ` placeholder="${ph}"` : ''}> ${text || aria || ph}`);
        }
        for (const child of Array.from(el.children)) walk(child, depth + 1);
      };
      walk(document.body);
      return results.slice(0, 150).join('\n');
    });
    return snapshot;
  } catch {
    return '';
  }
}

// ── Parse AI response → AiAction ─────────────────────────────────────────────
function parseAction(raw: string): AiAction {
  // Extract JSON block
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) ?? raw.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) {
    // Try to infer boolean answer from text
    const lower = raw.toLowerCase();
    if (lower.includes('yes') || lower.includes('true') || lower.includes('visible') || lower.includes('pass')) {
      return { action: 'answer', value: true };
    }
    if (lower.includes('no') || lower.includes('false') || lower.includes('not visible') || lower.includes('fail')) {
      return { action: 'answer', value: false };
    }
    return { action: 'none' };
  }
  try {
    return JSON.parse(jsonMatch[1]);
  } catch {
    return { action: 'none' };
  }
}

// ── Execute action on Playwright page ────────────────────────────────────────
async function executeAction(page: any, action: AiAction): Promise<boolean | void> {
  switch (action.action) {
    case 'click': {
      const sel = action.selector;

      // Strip leading icon chars (+, >, -, •) that VLM copies from button labels
      const cleanSel    = sel.replace(/^[+\->•*]\s*/, '').trim();
      // Detect if selector is plain text (no CSS syntax after cleaning)
      const isPlainText = !/[.#\[:>+~]/.test(cleanSel);
      const plainText   = isPlainText ? cleanSel : '';

      // Extract aria-label from complex selectors
      const ariaMatch = sel.match(/aria-label[*^$~]?=["']([^"']+)["']/i);
      const ariaText  = ariaMatch?.[1] ?? '';

      // Effective text to search by
      const labelText = plainText || ariaText || sel;

      const strategies = [
        // 1. Try as plain text → button by role
        () => page.getByRole('button', { name: new RegExp(`^${labelText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).first().click({ timeout: 6_000 }),
        // 2. Partial name match
        () => page.getByRole('button', { name: new RegExp(labelText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).first().click({ timeout: 5_000 }),
        // 3. getByText
        () => page.getByText(labelText, { exact: true }).first().click({ timeout: 5_000 }),
        () => page.getByText(labelText, { exact: false }).first().click({ timeout: 5_000 }),
        // 4. aria-label
        () => page.locator(`[aria-label*="${labelText}" i]`).first().click({ timeout: 5_000 }),
        // 5. Try original CSS selector
        () => page.locator(sel.replace(/\[type=['"]primary['"]\]/gi, '').replace(/\[class\*=['"][^'"]*['"]\]/gi, '')).first().click({ timeout: 5_000 }),
      ];
      let clicked = false;
      for (const strategy of strategies) {
        try { await strategy(); clicked = true; break; } catch { /* next */ }
      }
      if (!clicked) throw new Error(`AI click failed for selector: "${sel}"`);
      return;
    }

    case 'fill': {
      const sel = action.selector;
      const val = action.value;
      const strategies = [
        () => page.locator(sel).first().fill(val, { timeout: 8_000 }),
        () => page.getByPlaceholder(sel, { exact: false }).first().fill(val, { timeout: 5_000 }),
        () => page.locator(`input[placeholder*="${sel}" i]`).first().fill(val, { timeout: 5_000 }),
        () => page.locator('input:visible').first().fill(val, { timeout: 5_000 }),
      ];
      let filled = false;
      for (const strategy of strategies) {
        try { await strategy(); filled = true; break; } catch { /* next */ }
      }
      if (!filled) throw new Error(`AI fill failed for selector: "${sel}"`);
      return;
    }

    case 'verify':
      if (!action.passed) throw new Error(`AI verify failed: ${action.message}`);
      return true;

    case 'answer':
      return action.value;

    case 'wait':
      await page.waitForTimeout(action.ms ?? 2000);
      return;

    default:
      return;
  }
}

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a Playwright automation assistant. Given a page snapshot and instruction, respond with a JSON action.

Action types:
- Click:   {"action":"click","selector":"<SIMPLE selector — see rules>"}
- Fill:    {"action":"fill","selector":"<SIMPLE selector>","value":"<text>"}
- Verify:  {"action":"verify","passed":true/false,"message":"<reason>"}
- Answer:  {"action":"answer","value":true/false}
- Wait:    {"action":"wait","ms":2000}
- None:    {"action":"none"}

SELECTOR RULES (CRITICAL):
- Use ONLY the visible text label of the button/link. Examples:
  ✅ "Create new API key"   ✅ "Done"   ✅ "Cancel"   ✅ "Create"
- For inputs, use the placeholder text. Example: "Your Name"
- NEVER use CSS class selectors like .ant-btn, .btn-primary
- NEVER use [type='primary'] or complex attribute chains
- If you see the text in the snapshot, use that exact text as selector

For yes/no questions → use answer action with true/false.
For verify/check instructions → use verify action.
Wrap JSON in \`\`\`json ... \`\`\`
Respond with JSON only.`;

// ── Main ai() function ────────────────────────────────────────────────────────
export async function ai(
  instruction: string,
  { page, test: _test }: { page: any; test: any }
): Promise<boolean | void> {

  const screenshotB64 = await takeScreenshot(page);
  const snapshot = await getSnapshot(page);

  // Try VLM first (vision)
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: `data:image/png;base64,${screenshotB64}` },
        },
        {
          type: 'text',
          text: `Page text snapshot:\n${snapshot}\n\nInstruction: ${instruction}`,
        },
      ],
    },
  ];

  let rawResponse = '';
  try {
    rawResponse = await callWithFallback(VLM_MODELS, messages);
  } catch {
    // Fallback to text-only model with snapshot
    const textMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Page text snapshot:\n${snapshot}\n\nInstruction: ${instruction}`,
      },
    ];
    rawResponse = await callWithFallback(TEXT_MODELS, textMessages);
  }

  const action = parseAction(rawResponse);
  console.log(`  🤖 AI [${instruction.substring(0, 60)}] → ${JSON.stringify(action)}`);

  return executeAction(page, action);
}
