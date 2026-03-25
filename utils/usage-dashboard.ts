/**
 * utils/usage-dashboard.ts
 * Dashboard hiển thị usage các model FPT AI Marketplace.
 *
 * Usage:
 *   npm run usage                   # toàn bộ usage
 *   npm run usage:autotest          # chỉ model dùng trong autotest project
 *   npm run usage:key               # lọc theo API key name "v1"
 *   npx ts-node utils/usage-dashboard.ts --key mykey
 *
 * Flow:
 *   1. Kiểm tra session cũ còn valid không
 *   2. Nếu hết hạn → mở browser cho user login thủ công (hỗ trợ 2FA)
 *   3. Intercept Keycloak access_token từ token endpoint
 *   4. Gọi marketplace-api trực tiếp với Bearer token + pagination
 *   5. Hiển thị bảng usage đẹp trong terminal
 */

import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fetch, ProxyAgent } from 'undici';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ── CLI args ──────────────────────────────────────────────────────────────────
const args        = process.argv.slice(2);
const AUTOTEST_ONLY = args.includes('--autotest');
const KEY_FILTER    = args.includes('--key') ? args[args.indexOf('--key') + 1] : null;

// ── Config ────────────────────────────────────────────────────────────────────
const PROXY    = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://10.36.252.45:8080';
const AUTH_FILE = path.resolve(__dirname, '../playwright/.auth/prod-user.json');
const API_BASE  = 'https://marketplace-api.fptcloud.com';
const LOGIN_URL = 'https://marketplace.fptcloud.com/en/my-account?tab=my-usage';

// ── Autotest models ───────────────────────────────────────────────────────────
const AUTOTEST_MODELS = [
  'DeepSeek-V3.2',
  'Qwen3-32B',
  'GLM-4.7',
  'gpt-oss-120b',
  'Qwen2.5-Coder-32B',
  'Nemotron-3-Super-120B',
  'Kimi-K2.5',
  'gemma-3-27b',
];

// ── Categories ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'large_language_model', label: 'LLM / Chat'   },
  { key: 'embedding',            label: 'Embedding'    },
  { key: 'reranking',            label: 'Rerank'       },
  { key: 'vision',               label: 'Vision'       },
  { key: 'speech_to_text',       label: 'Speech→Text'  },
  { key: 'text_to_speech',       label: 'Text→Speech'  },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface UsageItem {
  model:          string;   // actual field name in API
  api_key_name:   string;
  totalRequest:   number;
  totalUsage:     number;   // total tokens (input + output)
  inputUsage:     number;
  outputUsage:    number;
  status:         string;
}

// ── Check session validity ────────────────────────────────────────────────────
function isSessionValid(): boolean {
  if (!fs.existsSync(AUTH_FILE)) return false;
  try {
    const state = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
    const cookies: any[] = state.cookies ?? [];
    const now = Date.now() / 1000;
    // Check KEYCLOAK_SESSION cookie expiry
    const kc = cookies.find(c => c.name === 'KEYCLOAK_SESSION');
    if (!kc || (kc.expires > 0 && kc.expires < now)) return false;
    return true;
  } catch {
    return false;
  }
}

// ── Step 1: Get Bearer token ──────────────────────────────────────────────────
async function getBearerToken(): Promise<string> {
  const sessionValid = isSessionValid();
  const headless = sessionValid; // non-headless nếu cần login thủ công

  if (!sessionValid) {
    console.log('⚠️  Session hết hạn. Đang mở browser để login...');
    console.log('   Vui lòng đăng nhập bình thường (kể cả 2FA nếu có).\n');
  } else {
    console.log('🔐 Session còn valid — đang lấy Bearer token...');
  }

  const browser = await chromium.launch({
    headless,
    proxy: { server: PROXY },
  });

  let token = '';

  try {
    const contextOptions: any = { proxy: { server: PROXY } };
    if (sessionValid) {
      contextOptions.storageState = AUTH_FILE;
    }

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    // Intercept Keycloak token response
    page.on('response', async (response) => {
      try {
        if (response.url().includes('openid-connect/token') && response.status() === 200) {
          const body = await response.json();
          if (body?.access_token) {
            token = `Bearer ${body.access_token}`;
            console.log('✅ Bearer token nhận được từ Keycloak');
          }
        }
      } catch { /* ignore */ }
    });

    await page.goto(LOGIN_URL, { waitUntil: 'load', timeout: 120_000 });

    if (!headless) {
      // Đợi user login xong — tối đa 3 phút
      console.log('\n⏳ Đang chờ bạn đăng nhập (tối đa 3 phút)...');
      console.log('   Sau khi trang my-account load xong, browser sẽ tự đóng.\n');

      // Dùng Promise.race giữa: token captured vs timeout
      await new Promise<void>((resolve) => {
        let elapsed = 0;
        const interval = setInterval(async () => {
          elapsed += 2000;
          if (token || elapsed >= 180_000) {
            clearInterval(interval);
            resolve();
            return;
          }
          try {
            const url = page.url();
            if (url.includes('my-account') && !token) {
              // Ở đúng trang rồi nhưng chưa có token — thử reload
              if (elapsed % 20_000 === 0) {
                await page.reload({ waitUntil: 'load', timeout: 15_000 }).catch(() => {});
              }
            }
          } catch { clearInterval(interval); resolve(); }
        }, 2000);

        // Cũng resolve nếu browser bị đóng
        context.on('close', () => { clearInterval(interval); resolve(); });
        browser.on('disconnected', () => { clearInterval(interval); resolve(); });
      });
    } else {
      // Session valid: chờ token refresh call
      await page.waitForTimeout(8000);
      if (!token) {
        await page.reload({ waitUntil: 'load', timeout: 30_000 });
        await page.waitForTimeout(5000);
      }
    }

    // Lưu session mới nếu login thủ công
    if (!sessionValid && token) {
      await context.storageState({ path: AUTH_FILE });
      console.log(`💾 Session mới đã lưu: ${AUTH_FILE}`);
    }
  } finally {
    await browser.close();
  }

  if (!token) {
    throw new Error(
      '❌ Không lấy được Bearer token.\n' +
      '   Nếu session hết hạn: chạy lại để mở browser login thủ công.\n' +
      '   Nếu trang yêu cầu 2FA: hoàn thành xác thực trong browser.'
    );
  }

  return token;
}

// ── Step 2: Fetch API key names ───────────────────────────────────────────────
async function fetchKeyNames(token: string): Promise<string[]> {
  const proxy = new ProxyAgent(PROXY);
  try {
    const res = await fetch(`${API_BASE}/subscription/v1/servings/usage/keyname`, {
      headers: { Authorization: token },
      dispatcher: proxy,
    } as any);
    if (!res.ok) return [];
    const data = await res.json() as any;
    const arr: any[] = Array.isArray(data) ? data : (data?.data ?? []);
    return arr.map((k: any) => k.keyname ?? k.key_name ?? k).filter(Boolean);
  } catch {
    return [];
  }
}

// ── Step 3: Fetch usage with pagination ──────────────────────────────────────
async function fetchUsage(token: string, category: string, keyName?: string): Promise<UsageItem[]> {
  const proxy = new ProxyAgent(PROXY);
  const items: UsageItem[] = [];
  let page = 1;
  const size = 100;

  while (true) {
    let url = `${API_BASE}/subscription/v1/servings/usage?page=${page}&size=${size}&usage_type=Paid&category=${category}&serving_type=Serverless`;
    if (keyName) url += `&api_key_name=${encodeURIComponent(keyName)}`;

    const res = await fetch(url, {
      headers: { Authorization: token },
      dispatcher: proxy,
    } as any);

    if (!res.ok) break;

    const data = await res.json() as any;
    const rows: UsageItem[] = data?.model_usages ?? data?.data ?? data?.items ?? [];
    if (rows.length === 0) break;

    items.push(...rows);

    const totalPages = data?.pagination?.total_of_pages ?? 1;
    if (page >= totalPages) break;
    page++;
  }

  return items;
}

// ── Formatting ────────────────────────────────────────────────────────────────
function fmtNum(n: number): string { return n.toLocaleString('en-US'); }
function trunc(s: string, max: number): string {
  return s.length > max ? s.substring(0, max - 1) + '…' : s;
}

function printTable(rows: Array<{ model: string; category: string; requests: number; tokens: number; keyName: string }>) {
  const W = { m: 44, c: 12, r: 10, t: 14, k: 10 };
  const sep = `─${'─'.repeat(W.m)}─┼─${'─'.repeat(W.c)}─┼─${'─'.repeat(W.r)}─┼─${'─'.repeat(W.t)}─┼─${'─'.repeat(W.k)}─`;

  const row = (m: string, c: string, r: string, t: string, k: string) =>
    ` ${m.padEnd(W.m)} │ ${c.padEnd(W.c)} │ ${r.padStart(W.r)} │ ${t.padStart(W.t)} │ ${k.padEnd(W.k)}`;

  console.log(`\n ─${'─'.repeat(sep.length - 2)}`);
  console.log(row('Model', 'Category', 'Requests', 'Total Tokens', 'API Key'));
  console.log(` ${sep}`);

  let totalReq = 0, totalTok = 0;
  for (const r of rows) {
    console.log(row(
      trunc(r.model,    W.m),
      trunc(r.category, W.c),
      fmtNum(r.requests),
      fmtNum(r.tokens),
      trunc(r.keyName || '—', W.k),
    ));
    totalReq += r.requests;
    totalTok += r.tokens;
  }

  console.log(` ${sep}`);
  console.log(row('TOTAL', '', fmtNum(totalReq), fmtNum(totalTok), ''));
  console.log(` ─${'─'.repeat(sep.length - 2)}\n`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║         FPT AI Marketplace — Usage Dashboard             ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  if (AUTOTEST_ONLY) console.log('🔍 Filter: Autotest models only');
  if (KEY_FILTER)    console.log(`🔑 Filter: API key = "${KEY_FILTER}"`);
  console.log();

  // 1. Get token
  const token = await getBearerToken();
  console.log();

  // 2. Get API key names
  const keyNames = await fetchKeyNames(token);
  if (keyNames.length > 0) {
    console.log('📋 API Keys:');
    keyNames.forEach((k: any) => console.log(`   • ${k.key_name}`));
    console.log();
  }

  // 3. Fetch all categories
  console.log('📥 Fetching usage data...\n');
  const allRows: Array<{ model: string; category: string; requests: number; tokens: number; keyName: string }> = [];

  for (const cat of CATEGORIES) {
    process.stdout.write(`   ${cat.label.padEnd(14)}`);
    try {
      const items = await fetchUsage(token, cat.key, KEY_FILTER ?? undefined);
      process.stdout.write(`${items.length} records\n`);

      for (const item of items) {
        if (AUTOTEST_ONLY) {
          const name = (item.model_name || item.serving_name || '').toLowerCase();
          if (!AUTOTEST_MODELS.some(m => name.includes(m.toLowerCase()))) continue;
        }
        allRows.push({
          model:    item.model_name || item.serving_name || '(unknown)',
          category: cat.label,
          requests: item.total_request ?? 0,
          tokens:   item.total_token   ?? 0,
          keyName:  item.key_name       ?? '',
        });
      }
    } catch (err) {
      process.stdout.write(`⚠️  ${(err as Error).message}\n`);
    }
  }

  if (allRows.length === 0) {
    console.log('\n⚠️  Không có data. Thử bỏ filter hoặc kiểm tra API key.\n');
    return;
  }

  // 4. Sort & display
  allRows.sort((a, b) => b.tokens - a.tokens);

  const title = `Usage Summary${AUTOTEST_ONLY ? ' — Autotest' : ''}${KEY_FILTER ? ` — key: ${KEY_FILTER}` : ''}`;
  console.log(`\n📊 ${title}`);
  printTable(allRows);

  if (!AUTOTEST_ONLY && allRows.length > 5) {
    console.log('🏆 Top 5 by token usage:');
    allRows.slice(0, 5).forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.model.padEnd(42)} ${fmtNum(r.tokens).padStart(12)} tokens`);
    });
    console.log();
  }
}

main().catch(err => {
  console.error('\n❌', err.message);
  process.exit(1);
});
