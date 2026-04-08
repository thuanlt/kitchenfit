/**
 * agents/test-agent.ts
 * AI QA Agent — autonomous E2E testing via Claude + Playwright MCP.
 *
 * Implements a proper agentic tool-use loop:
 *   Claude receives task → calls Playwright MCP tools → observes results → repeats → reports
 *
 * Usage:
 *   npx ts-node agents/test-agent.ts
 *   npx ts-node agents/test-agent.ts --flow login
 *   npx ts-node agents/test-agent.ts --flow checkout --url https://staging.marketplace.fpt.ai
 */

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { callFptWithFallback } from '../tools/fpt-client';
dotenv.config();

// ── Retry 529 ─────────────────────────────────────────────────────────────────
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const is529 = err?.status === 529 || err?.message?.includes('overloaded');
      if (is529 && i < maxRetries - 1) {
        const wait = Math.pow(2, i) * 1000;
        console.warn(`⚠️  529 Overloaded — retry ${i + 1}/${maxRetries} in ${wait}ms`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries reached');
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BASE_URL   = process.env.BASE_URL ?? 'https://marketplace.fpt.ai';
const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? '';
const TEST_PASS  = process.env.TEST_USER_PASSWORD ?? '';

// ── CLI args ──────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const flowArg = args.find((_, i) => args[i - 1] === '--flow') ?? 'all';
const urlArg  = args.find((_, i) => args[i - 1] === '--url')  ?? BASE_URL;

// ── Test scenarios ────────────────────────────────────────────────────────────
const TEST_SCENARIOS: Record<string, string> = {
  login: `
    Kiểm thử luồng đăng nhập trên FPT Marketplace tại ${urlArg}:
    1. Mở trang ${urlArg}/login
    2. Chụp màn hình trang login
    3. Điền email: ${TEST_EMAIL} và mật khẩu: ${TEST_PASS}
    4. Nhấn nút đăng nhập
    5. Chờ trang load xong (networkidle)
    6. Kiểm tra đã đăng nhập thành công (avatar/tên user hiển thị)
    7. Chụp màn hình kết quả
    8. Báo cáo PASS hoặc FAIL với lý do cụ thể
  `,
  search: `
    Kiểm thử luồng tìm kiếm trên FPT Marketplace tại ${urlArg}:
    1. Mở trang ${urlArg}
    2. Tìm thanh tìm kiếm và nhập từ khoá "phần mềm"
    3. Nhấn Enter hoặc nút tìm kiếm
    4. Chờ kết quả xuất hiện
    5. Chụp màn hình trang kết quả
    6. Đếm số lượng sản phẩm hiển thị
    7. Click vào sản phẩm đầu tiên
    8. Kiểm tra trang chi tiết sản phẩm load thành công
    9. Chụp màn hình trang chi tiết
    10. Báo cáo PASS hoặc FAIL với lý do cụ thể
  `,
  checkout: `
    Kiểm thử luồng checkout trên FPT Marketplace tại ${urlArg}:
    1. Đăng nhập với ${TEST_EMAIL} / ${TEST_PASS}
    2. Tìm kiếm "cloud service"
    3. Click vào sản phẩm đầu tiên
    4. Nhấn "Thêm vào giỏ" hoặc "Mua ngay"
    5. Mở giỏ hàng, kiểm tra sản phẩm
    6. Nhấn Thanh toán
    7. Chụp màn hình trang checkout
    8. Báo cáo PASS hoặc FAIL với lý do cụ thể
  `,
  all: `
    Chạy toàn bộ luồng E2E trên FPT Marketplace tại ${urlArg}:
    Login → Search → Product Detail → Add to Cart → Checkout
    Báo cáo từng bước với status PASS/FAIL.
  `,
};

// ── Playwright MCP server config ──────────────────────────────────────────────
// Playwright MCP server phải đang chạy: npx @playwright/mcp@latest --port 3001
const MCP_SERVER_URL = process.env.PLAYWRIGHT_MCP_URL ?? 'http://localhost:3001/mcp';

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
Bạn là AI QA Agent chuyên nghiệp cho FPT Marketplace.

Nhiệm vụ:
- Sử dụng Playwright MCP tools để điều khiển trình duyệt
- Thực hiện test case E2E theo yêu cầu
- Chụp screenshot tại các bước quan trọng
- Phân tích kết quả và báo cáo rõ ràng

Nguyên tắc:
- Luôn chờ networkidle trước khi thao tác
- Nếu selector không tìm thấy, thử selector thay thế
- Ghi lại mọi lỗi với đầy đủ context
- Báo cáo theo format: ✅ PASS hoặc ❌ FAIL + lý do

Format báo cáo cuối:
---
📋 TEST REPORT
Flow: [tên flow]
Status: ✅ PASS / ❌ FAIL
Steps completed: X/Y
Issues: [danh sách nếu có]
---
`.trim();

// ── Agentic loop ──────────────────────────────────────────────────────────────
async function runAgent(flow: string) {
  console.log(`\n🤖 FPT Marketplace AI Test Agent`);
  console.log(`📋 Flow: ${flow} | 🌐 URL: ${urlArg}`);
  console.log('─'.repeat(50));

  const scenario = TEST_SCENARIOS[flow] ?? TEST_SCENARIOS.all;
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: scenario }];

  try {
    // Use mcp_servers for automatic tool injection from Playwright MCP
    const response = await callWithRetry(() => (client.messages.create as any)({
      model:       'claude-sonnet-4-6',
      max_tokens:  8192,
      system:      SYSTEM_PROMPT,
      messages,
      mcp_servers: [{
        type: 'url',
        url:  MCP_SERVER_URL,
        name: 'playwright',
      }],
      betas: ['mcp-client-2025-04-04'],
    }));

    console.log('\n📊 Agent Report:\n');
    for (const block of response.content) {
      if (block.type === 'text') console.log(block.text);
    }

    return response;
  } catch (err: any) {
    const isCredits = err?.message?.includes('credit balance') || err?.status === 402;
    const isMcpDown = err?.message?.includes('mcp') || err?.message?.includes('connect') || err?.message?.includes('ECONNREFUSED');

    if (isCredits) {
      // Fallback: use FPT model as orchestrator (no Anthropic needed)
      console.warn('\n⚠️  Anthropic credits exhausted — switching to FPT model orchestrator (Kimi-K2.5)');
      const { content } = await callFptWithFallback([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: scenario },
      ], { maxTokens: 4096, models: ['Kimi-K2.5', 'Nemotron-3-Super-120B-A12B', 'GLM-4.7'] });
      console.log('\n📊 Agent Report:\n', content);
      return content;
    }

    if (isMcpDown) {
      // Fallback: MCP not running — analysis-only via Claude
      console.warn('\n⚠️  Playwright MCP server not reachable. Running in analysis-only mode.');
      console.warn('   Start MCP server: npx @playwright/mcp@latest --port 3001\n');
      const fallback = await client.messages.create({
        model:     'claude-sonnet-4-6',
        max_tokens: 2048,
        system:    SYSTEM_PROMPT,
        messages,
      });
      for (const block of fallback.content) {
        if (block.type === 'text') console.log(block.text);
      }
      return fallback;
    }

    throw err;
  }
}

// ── Entry ─────────────────────────────────────────────────────────────────────
runAgent(flowArg)
  .then(() => { console.log('\n✅ Agent run complete'); process.exit(0); })
  .catch(err => { console.error('\n❌ Agent failed:', err.message); process.exit(1); });
