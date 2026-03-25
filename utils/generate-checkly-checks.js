/**
 * generate-checkly-checks.js
 * Tự động generate checkly/api/fpt-api-health.check.js
 * từ danh sách models trong tests/api/api-inference.spec.ts
 *
 * Usage:
 *   node utils/generate-checkly-checks.js
 *   → Ghi ra checkly/api/fpt-api-health.check.js
 *   → Sau đó: npx checkly deploy --force
 */

const fs   = require('fs');
const path = require('path');

// ── Model definitions (sync với api-inference.spec.ts) ────────────────────────
// type: 'chat' | 'vision' | 'embedding' | 'rerank' | 'tts'
// skip: true  → bị test.skip trong spec → không monitor

const MODELS = [
  // ── Chat / Text ─────────────────────────────────────────────────────────────
  { id: 'DeepSeek-V3.2-Speciale',              type: 'chat' },
  { id: 'GLM-4.5',                             type: 'chat',      skip: true },
  { id: 'GLM-4.7',                             type: 'chat' },
  { id: 'gpt-oss-120b',                        type: 'chat' },
  { id: 'gpt-oss-20b',                         type: 'chat' },
  { id: 'Qwen2.5-Coder-32B-Instruct',          type: 'chat' },
  { id: 'Qwen3-32B',                           type: 'chat' },
  { id: 'Qwen3-Coder-480B-A35B-Instruct',      type: 'chat',      skip: true },
  { id: 'gemma-3-27b-it',                      type: 'chat' },
  { id: 'SaoLa3.1-medium',                     type: 'chat' },
  { id: 'SaoLa-Llama3.1-planner',              type: 'chat' },
  { id: 'Llama-3.3-70B-Instruct',              type: 'chat' },
  { id: 'Llama-3.3-Swallow-70B-Instruct-v0.4', type: 'chat' },
  { id: 'Kimi-K2.5',                           type: 'chat' },
  { id: 'SaoLa4-medium',                       type: 'chat' },
  { id: 'SaoLa4-small',                        type: 'chat' },
  { id: 'Nemotron-3-Super-120B-A12B',          type: 'chat' },
  // ── Vision / Multimodal ─────────────────────────────────────────────────────
  { id: 'Qwen3-VL-8B-Instruct',               type: 'vision' },
  { id: 'Qwen2.5-VL-7B-Instruct',             type: 'vision' },
  { id: 'DeepSeek-OCR',                        type: 'vision' },
  { id: 'FPT.AI-Table-Parsing-v1.1',           type: 'vision',    skip: true },
  { id: 'Alpamayo-R1-10B',                     type: 'vision' },
  { id: 'FPT.AI-KIE-v1.7',                     type: 'vision' },
  // ── Embedding ───────────────────────────────────────────────────────────────
  { id: 'multilingual-e5-large',               type: 'embedding' },
  { id: 'Vietnamese_Embedding',                type: 'embedding' },
  // ── Rerank ──────────────────────────────────────────────────────────────────
  { id: 'bge-reranker-v2-m3',                  type: 'rerank' },
  // ── TTS ─────────────────────────────────────────────────────────────────────
  { id: 'FPT.AI-VITs',                         type: 'tts' },
  // ── STT — SKIP trong Checkly vì các lý do sau: ──────────────────────────────
  // 1. API dùng multipart/form-data với binary file upload
  //    → Checkly ApiCheck chỉ hỗ trợ JSON body, không hỗ trợ multipart
  // 2. File audio (test-data/audio/honlecuae.mp3) nằm trên máy local
  //    → Checkly chạy từ cloud Singapore, không truy cập được file local
  // 3. Workaround cần thiết nếu muốn monitor STT:
  //    → Upload audio lên public URL (GitLab Pages / CDN)
  //    → Dùng Checkly setupScript để fetch + base64 encode audio
  // 4. Hiện tại: dùng Playwright test (api-inference.spec.ts TC_API_026/027/028)
  //    để test STT khi chạy local/CI — đủ coverage, không cần Checkly
  { id: 'FPT.AI-whisper-large-v3-turbo',       type: 'stt',       skip: true },
  { id: 'FPT.AI-whisper-medium',               type: 'stt',       skip: true },
  { id: 'whisper-large-v3-turbo',              type: 'stt',       skip: true },
];

const IMAGE_URL = 'https://raw.githubusercontent.com/open-mmlab/mmdeploy/main/demo/resources/det.jpg';
const MSG_SHORT = 'Hi, reply with one word: OK';

// ── Request body builder ──────────────────────────────────────────────────────

function buildRequest(model) {

  switch (model.type) {
    case 'chat':
      return {
        url:     `\${BASE}/v1/chat/completions?from=\${FROM}&model=${model.id}`,
        body:    JSON.stringify({ model: model.id, messages: [{ role: 'user', content: MSG_SHORT }], streaming: false, max_tokens: 10 }),
        assertions: [
          `AssertionBuilder.statusCode().equals(200)`,
          `AssertionBuilder.jsonBody('$.choices').isNotNull()`,
          `AssertionBuilder.responseTime().lessThan(30000)`,
        ],
      };

    case 'vision':
      return {
        url:     `\${BASE}/v1/chat/completions?from=\${FROM}&model=${model.id}`,
        body:    JSON.stringify({ model: model.id, messages: [{ role: 'user', content: [{ type: 'text', text: 'What is in this image?' }, { type: 'image_url', image_url: { url: IMAGE_URL } }] }], streaming: false, max_tokens: 50 }),
        assertions: [
          `AssertionBuilder.statusCode().equals(200)`,
          `AssertionBuilder.jsonBody('$.choices').isNotNull()`,
          `AssertionBuilder.responseTime().lessThan(60000)`,
        ],
      };

    case 'embedding':
      return {
        url:     `\${BASE}/v1/embeddings?from=\${FROM}&model=${model.id}`,
        body:    JSON.stringify({ model: model.id, input: 'Hello world test.' }),
        assertions: [
          `AssertionBuilder.statusCode().equals(200)`,
          `AssertionBuilder.jsonBody('$.data').isNotNull()`,
          `AssertionBuilder.responseTime().lessThan(15000)`,
        ],
      };

    case 'rerank':
      return {
        url:     `\${BASE}/v1/rerank?from=\${FROM}&model=${model.id}`,
        body:    JSON.stringify({ model: model.id, query: 'What is AI?', documents: ['AI is artificial intelligence.', 'The sky is blue.'] }),
        assertions: [
          `AssertionBuilder.statusCode().equals(200)`,
          `AssertionBuilder.jsonBody('$.results').isNotNull()`,
          `AssertionBuilder.responseTime().lessThan(15000)`,
        ],
      };

    case 'tts':
      return {
        url:     `\${BASE}/v1/audio/speech?from=\${FROM}&model=${model.id}`,
        body:    JSON.stringify({ model: model.id, input: 'Hello.', voice: 'alloy' }),
        assertions: [
          `AssertionBuilder.statusCode().equals(200)`,
          `AssertionBuilder.responseTime().lessThan(30000)`,
        ],
      };
  }
}

// ── Logical ID sanitizer ──────────────────────────────────────────────────────

function toLogicalId(modelId) {
  return modelId.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// ── Generate check code ───────────────────────────────────────────────────────

function generateCheck(model) {
  const req     = buildRequest(model);
  const logicId = toLogicalId(model.id);
  const label   = model.type === 'chat' ? '🤖' : model.type === 'vision' ? '👁️' : model.type === 'embedding' ? '📐' : model.type === 'rerank' ? '🔍' : '🔊';
  const maxResp = model.type === 'vision' ? 60000 : model.type === 'chat' ? 30000 : 15000;

  return `
new ApiCheck('${logicId}', {
  name:      '${label} ${model.id}',
  activated: true,
  frequency: Frequency.EVERY_6H,
  locations: ['ap-southeast-1'],
  tags:      ['fpt', '${model.type}'],
  degradedResponseTime: 5000,
  maxResponseTime:      ${maxResp},
  request: {
    method:  'POST',
    url:     \`${req.url}\`,
    headers: HEADERS,
    body:    \`${req.body.replace(/`/g, '\\`')}\`,
    assertions: [
      ${req.assertions.join(',\n      ')},
    ],
  },
});`.trim();
}

// ── Main ──────────────────────────────────────────────────────────────────────

const activeModels = MODELS.filter(m => !m.skip);
console.log(`\n📋 Generating Checkly checks for ${activeModels.length} models (${MODELS.filter(m => m.skip).length} skipped):\n`);

const byType = {};
for (const m of activeModels) {
  byType[m.type] = byType[m.type] || [];
  byType[m.type].push(m.id);
}
for (const [type, ids] of Object.entries(byType)) {
  console.log(`  ${type}: ${ids.join(', ')}`);
}

const checks = activeModels.map(generateCheck).join('\n\n');

const output = `/**
 * fpt-api-health.check.js
 * AUTO-GENERATED by utils/generate-checkly-checks.js
 * Date: ${new Date().toISOString()}
 * Models: ${activeModels.length} active (${MODELS.filter(m => m.skip).length} skipped)
 *
 * To regenerate: node utils/generate-checkly-checks.js
 * To deploy:     npx checkly deploy --force
 */

const { ApiCheck, AssertionBuilder, Frequency } = require('checkly/constructs');

const BASE    = process.env.FPT_API_URL || 'https://mkp-api.fptcloud.com';
const FROM    = process.env.FPT_FROM    || 'thuanlt9';
const KEY     = process.env.FPT_API_KEY || '';
const HEADERS = [
  { key: 'Content-Type',  value: 'application/json' },
  { key: 'Authorization', value: \`Bearer \${KEY}\` },
];

${checks}
`;

const outFile = path.resolve(__dirname, '../checkly/api/fpt-api-health.check.js');
fs.writeFileSync(outFile, output, 'utf-8');
console.log(`\n✅ Generated: ${outFile}`);
console.log(`   ${activeModels.length} checks total\n`);
console.log('👉 Next: npx checkly deploy --force\n');
