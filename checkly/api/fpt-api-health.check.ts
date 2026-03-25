/**
 * fpt-api-health.check.ts
 * API checks chạy mỗi 10 phút từ Singapore
 * Alert qua Email + Slack khi fail
 */

import { ApiCheck, AssertionBuilder, Frequency } from 'checkly/constructs';

const BASE  = process.env.FPT_API_URL  || 'https://mkp-api.fptcloud.com';
const KEY   = process.env.FPT_API_KEY  || '';
const FROM  = process.env.FPT_FROM     || 'thuanlt9';

const HEADERS = {
  'Content-Type':  'application/json',
  'Authorization': `Bearer ${KEY}`,
};

// ── CHECK 1: GLM-4.7 (flagship model) ─────────────────────────────────────

new ApiCheck('glm-47-health', {
  name:        '🤖 GLM-4.7 — Chat Completions',
  activated:   true,
  frequency:   Frequency.EVERY_10M,
  locations:   ['ap-southeast-1'],
  tags:        ['fpt', 'llm', 'glm'],
  degradedResponseTime: 5000,   // warn nếu > 5s
  maxResponseTime:      30000,  // fail nếu > 30s
  request: {
    method: 'POST',
    url:    `${BASE}/v1/chat/completions?from=${FROM}&model=GLM-4.7`,
    headers: HEADERS,
    body: JSON.stringify({
      model:    'GLM-4.7',
      messages: [{ role: 'user', content: 'Hi, reply with one word: OK' }],
      streaming: false, max_tokens: 10,
    }),
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.jsonBody('$.choices').isNotNull(),
      AssertionBuilder.jsonBody('$.choices[0].message.content').isNotNull(),
      AssertionBuilder.responseTime().lessThan(30000),
    ],
  },
});

// ── CHECK 2: Qwen3-32B ─────────────────────────────────────────────────────

new ApiCheck('qwen3-32b-health', {
  name:        '🤖 Qwen3-32B — Chat Completions',
  activated:   true,
  frequency:   Frequency.EVERY_10M,
  locations:   ['ap-southeast-1'],
  tags:        ['fpt', 'llm', 'qwen'],
  degradedResponseTime: 5000,
  maxResponseTime:      30000,
  request: {
    method: 'POST',
    url:    `${BASE}/v1/chat/completions?from=${FROM}&model=Qwen3-32B`,
    headers: HEADERS,
    body: JSON.stringify({
      model:    'Qwen3-32B',
      messages: [{ role: 'user', content: 'Hi, reply with one word: OK' }],
      streaming: false, max_tokens: 10,
    }),
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.jsonBody('$.choices').isNotNull(),
      AssertionBuilder.responseTime().lessThan(30000),
    ],
  },
});

// ── CHECK 3: DeepSeek-V3 ───────────────────────────────────────────────────

new ApiCheck('deepseek-v3-health', {
  name:        '🤖 DeepSeek-V3 — Chat Completions',
  activated:   true,
  frequency:   Frequency.EVERY_10M,
  locations:   ['ap-southeast-1'],
  tags:        ['fpt', 'llm', 'deepseek'],
  degradedResponseTime: 5000,
  maxResponseTime:      30000,
  request: {
    method: 'POST',
    url:    `${BASE}/v1/chat/completions?from=${FROM}&model=DeepSeek-V3.2-Speciale`,
    headers: HEADERS,
    body: JSON.stringify({
      model:    'DeepSeek-V3.2-Speciale',
      messages: [{ role: 'user', content: 'Hi, reply with one word: OK' }],
      streaming: false, max_tokens: 10,
    }),
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.jsonBody('$.choices').isNotNull(),
      AssertionBuilder.responseTime().lessThan(30000),
    ],
  },
});

// ── CHECK 4: Marketplace homepage health ──────────────────────────────────

new ApiCheck('marketplace-homepage-health', {
  name:        '🌐 Marketplace Homepage — HTTP 200',
  activated:   true,
  frequency:   Frequency.EVERY_5M,
  locations:   ['ap-southeast-1'],
  tags:        ['fpt', 'ui', 'uptime'],
  degradedResponseTime: 3000,
  maxResponseTime:      10000,
  request: {
    method: 'GET',
    url:    'https://marketplace.fptcloud.com/en',
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.responseTime().lessThan(10000),
    ],
  },
});
