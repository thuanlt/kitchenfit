/**
 * fpt-api-health.check.js
 * API checks chạy mỗi 6 tiếng từ Singapore
 */

const { ApiCheck, AssertionBuilder, Frequency } = require('checkly/constructs');

const BASE    = process.env.FPT_API_URL || 'https://mkp-api.fptcloud.com';
const KEY     = process.env.FPT_API_KEY || '';
const FROM    = process.env.FPT_FROM    || 'thuanlt9';
const HEADERS = [
  { key: 'Content-Type',  value: 'application/json' },
  { key: 'Authorization', value: `Bearer ${KEY}` },
];

function chatBody(model) {
  return JSON.stringify({
    model,
    messages: [{ role: 'user', content: 'Hi, reply with one word: OK' }],
    streaming: false, max_tokens: 10,
  });
}

// ── GLM-4.7 ──────────────────────────────────────────────────────────────────
new ApiCheck('glm-47-health', {
  name:      '🤖 GLM-4.7 — Chat Completions',
  activated: true,
  frequency: Frequency.EVERY_6H,
  locations: ['ap-southeast-1'],
  tags:      ['fpt', 'llm'],
  degradedResponseTime: 5000,
  maxResponseTime:      30000,
  request: {
    method:  'POST',
    url:     `${BASE}/v1/chat/completions?from=${FROM}&model=GLM-4.7`,
    headers: HEADERS,
    body:    chatBody('GLM-4.7'),
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.jsonBody('$.choices').isNotNull(),
      AssertionBuilder.responseTime().lessThan(30000),
    ],
  },
});

// ── Qwen3-32B ─────────────────────────────────────────────────────────────────
new ApiCheck('qwen3-32b-health', {
  name:      '🤖 Qwen3-32B — Chat Completions',
  activated: true,
  frequency: Frequency.EVERY_6H,
  locations: ['ap-southeast-1'],
  tags:      ['fpt', 'llm'],
  degradedResponseTime: 5000,
  maxResponseTime:      30000,
  request: {
    method:  'POST',
    url:     `${BASE}/v1/chat/completions?from=${FROM}&model=Qwen3-32B`,
    headers: HEADERS,
    body:    chatBody('Qwen3-32B'),
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.jsonBody('$.choices').isNotNull(),
      AssertionBuilder.responseTime().lessThan(30000),
    ],
  },
});

// ── DeepSeek-V3 ───────────────────────────────────────────────────────────────
new ApiCheck('deepseek-v3-health', {
  name:      '🤖 DeepSeek-V3 — Chat Completions',
  activated: true,
  frequency: Frequency.EVERY_6H,
  locations: ['ap-southeast-1'],
  tags:      ['fpt', 'llm'],
  degradedResponseTime: 5000,
  maxResponseTime:      30000,
  request: {
    method:  'POST',
    url:     `${BASE}/v1/chat/completions?from=${FROM}&model=DeepSeek-V3.2-Speciale`,
    headers: HEADERS,
    body:    chatBody('DeepSeek-V3.2-Speciale'),
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.jsonBody('$.choices').isNotNull(),
      AssertionBuilder.responseTime().lessThan(30000),
    ],
  },
});

// ── Marketplace Homepage ──────────────────────────────────────────────────────
new ApiCheck('marketplace-homepage-health', {
  name:      '🌐 Marketplace Homepage — HTTP 200',
  activated: true,
  frequency: Frequency.EVERY_5M,
  locations: ['ap-southeast-1'],
  tags:      ['fpt', 'uptime'],
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
