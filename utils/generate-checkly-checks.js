/**
 * generate-checkly-checks.js
 * Tự động generate checkly/api/fpt-api-health.check.js
 * cho cả VN site (mkp-api.fptcloud.com) và JP site (mkp-api.fptcloud.jp)
 *
 * Usage:
 *   node utils/generate-checkly-checks.js
 *   → Ghi ra checkly/api/fpt-api-health.check.js
 *   → Sau đó: npx checkly deploy --force
 */

const fs   = require('fs');
const path = require('path');

// ── VN site models (sync với api-inference.spec.ts) ───────────────────────────
const MODELS_VN = [
  // Chat
  { id: 'DeepSeek-V3.2-Speciale',              type: 'chat',      skip: true },
  { id: 'GLM-4.5',                             type: 'chat',      skip: true },
  { id: 'GLM-4.7',                             type: 'chat' },
  { id: 'gpt-oss-120b',                        type: 'chat' },
  { id: 'gpt-oss-20b',                         type: 'chat' },
  { id: 'Qwen2.5-Coder-32B-Instruct',          type: 'chat',      skip: true },
  { id: 'Qwen3-32B',                           type: 'chat' },
  { id: 'Qwen3-Coder-480B-A35B-Instruct',      type: 'chat',      skip: true },
  { id: 'gemma-3-27b-it',                      type: 'chat' },
  { id: 'SaoLa3.1-medium',                     type: 'chat' },
  { id: 'SaoLa-Llama3.1-planner',              type: 'chat' },
  { id: 'Llama-3.3-70B-Instruct',              type: 'chat' },
  { id: 'Llama-3.3-Swallow-70B-Instruct-v0.4', type: 'chat',      skip: true },
  { id: 'Kimi-K2.5',                           type: 'chat' },
  { id: 'SaoLa4-medium',                       type: 'chat' },
  { id: 'SaoLa4-small',                        type: 'chat' },
  { id: 'Nemotron-3-Super-120B-A12B',          type: 'chat' },
  // Vision
  { id: 'Qwen3-VL-8B-Instruct',               type: 'vision',    skip: true },
  { id: 'Qwen2.5-VL-7B-Instruct',             type: 'vision' },
  { id: 'DeepSeek-OCR',                        type: 'vision',    skip: true },
  { id: 'FPT.AI-Table-Parsing-v1.1',           type: 'vision',    skip: true },
  { id: 'Alpamayo-R1-10B',                     type: 'vision',    skip: true },
  { id: 'FPT.AI-KIE-v1.7',                     type: 'vision' },
  // Embedding
  { id: 'multilingual-e5-large',               type: 'embedding' },
  { id: 'Vietnamese_Embedding',                type: 'embedding' },
  // Rerank
  { id: 'bge-reranker-v2-m3',                  type: 'rerank' },
  // TTS
  { id: 'FPT.AI-VITs',                         type: 'tts' },
  // STT — skip (multipart, local file)
  { id: 'FPT.AI-whisper-large-v3-turbo',       type: 'stt',       skip: true },
  { id: 'FPT.AI-whisper-medium',               type: 'stt',       skip: true },
  { id: 'whisper-large-v3-turbo',              type: 'stt',       skip: true },
];

// ── JP site models (sync với api-inference-jp.spec.ts) ────────────────────────
const MODELS_JP = [
  // Chat
  { id: 'Kimi-K2.5',                           type: 'chat' },
  { id: 'SaoLa4-medium',                       type: 'chat' },
  { id: 'SaoLa4-small',                        type: 'chat' },
  { id: 'DeepSeek-V3.2-Speciale',              type: 'chat',      skip: true },
  { id: 'GLM-4.5',                             type: 'chat',      skip: true },
  { id: 'GLM-4.7',                             type: 'chat' },
  { id: 'gpt-oss-120b',                        type: 'chat' },
  { id: 'gpt-oss-20b',                         type: 'chat' },
  { id: 'Qwen2.5-Coder-32B-Instruct',          type: 'chat',      skip: true },
  { id: 'Qwen3-32B',                           type: 'chat' },
  { id: 'Qwen3-Coder-480B-A35B-Instruct',      type: 'chat',      skip: true },
  { id: 'Llama-3.3-70B-Instruct',              type: 'chat' },
  { id: 'Llama-3.3-Swallow-70B-Instruct-v0.4', type: 'chat',      skip: true },
  { id: 'Nemotron-3-Super-120B-A12B',          type: 'chat' },
  // Vision
  { id: 'Qwen3-VL-8B-Instruct',               type: 'vision',    skip: true },
  { id: 'Qwen2.5-VL-7B-Instruct',             type: 'vision' },
  { id: 'DeepSeek-OCR',                        type: 'vision',    skip: true },
  { id: 'gemma-3-27b-it',                      type: 'vision' },
  { id: 'FPT.AI-Table-Parsing-v1.1',           type: 'vision',    skip: true },
  { id: 'FPT.AI-KIE-v1.7',                     type: 'vision' },
  { id: 'Alpamayo-R1-10B',                     type: 'vision',    skip: true },
  { id: 'gemma-4-31B-it',                      type: 'vision' },
  { id: 'gemma-4-26B-A4B-it',                  type: 'vision' },
  { id: 'FCI-Document-Parsing-V1.0',           type: 'vision' },
  // Embedding
  { id: 'multilingual-e5-large',               type: 'embedding' },
  { id: 'gte-multilingual-base',               type: 'embedding', skip: true },
  { id: 'bge-m3',                              type: 'embedding', skip: true },
  // Rerank
  { id: 'bge-reranker-v2-m3',                  type: 'rerank' },
  // STT — skip (multipart, local file)
  { id: 'FPT.AI-whisper-large-v3-turbo',       type: 'stt',       skip: true },
  { id: 'FPT.AI-whisper-medium',               type: 'stt',       skip: true },
  // Protein structure
  { id: 'Boltz-2',                             type: 'protein' },
];

const IMAGE_URL = 'https://raw.githubusercontent.com/open-mmlab/mmdeploy/main/demo/resources/det.jpg';
const MSG_SHORT = 'Hi, reply with one word: OK';

// ── Request body builder ──────────────────────────────────────────────────────

function buildRequest(model, baseVar) {
  switch (model.type) {
    case 'chat':
      return {
        url:  `\${${baseVar}}/v1/chat/completions?from=\${FROM}&model=${model.id}`,
        body: JSON.stringify({ model: model.id, messages: [{ role: 'user', content: MSG_SHORT }], streaming: false, max_tokens: 10 }),
        assertions: [
          `AssertionBuilder.statusCode().equals(200)`,
          `AssertionBuilder.jsonBody('$.choices').isNotNull()`,
          `AssertionBuilder.responseTime().lessThan(30000)`,
        ],
      };
    case 'vision':
      return {
        url:  `\${${baseVar}}/v1/chat/completions?from=\${FROM}&model=${model.id}`,
        body: JSON.stringify({ model: model.id, messages: [{ role: 'user', content: [{ type: 'text', text: 'What is in this image?' }, { type: 'image_url', image_url: { url: IMAGE_URL } }] }], streaming: false, max_tokens: 50 }),
        assertions: [
          `AssertionBuilder.statusCode().equals(200)`,
          `AssertionBuilder.jsonBody('$.choices').isNotNull()`,
          `AssertionBuilder.responseTime().lessThan(30000)`,
        ],
      };
    case 'embedding':
      return {
        url:  `\${${baseVar}}/v1/embeddings?from=\${FROM}&model=${model.id}`,
        body: JSON.stringify({ model: model.id, input: 'Hello world test.' }),
        assertions: [
          `AssertionBuilder.statusCode().equals(200)`,
          `AssertionBuilder.jsonBody('$.data').isNotNull()`,
          `AssertionBuilder.responseTime().lessThan(15000)`,
        ],
      };
    case 'rerank':
      return {
        url:  `\${${baseVar}}/v1/rerank?from=\${FROM}&model=${model.id}`,
        body: JSON.stringify({ model: model.id, query: 'What is AI?', documents: ['AI is artificial intelligence.', 'The sky is blue.'] }),
        assertions: [
          `AssertionBuilder.statusCode().equals(200)`,
          `AssertionBuilder.jsonBody('$.results').isNotNull()`,
          `AssertionBuilder.responseTime().lessThan(15000)`,
        ],
      };
    case 'tts':
      return {
        url:  `\${${baseVar}}/v1/audio/speech?from=\${FROM}&model=${model.id}`,
        body: JSON.stringify({ model: model.id, input: 'Hello.', voice: 'alloy' }),
        assertions: [
          `AssertionBuilder.statusCode().equals(200)`,
          `AssertionBuilder.responseTime().lessThan(30000)`,
        ],
      };
    case 'protein':
      return {
        url:  `\${${baseVar}}/v1/predict?from=\${FROM}&model=${model.id}`,
        body: JSON.stringify({
          model: model.id,
          polymers: [{ id: 'A', molecule_type: 'protein', sequence: 'MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR' }],
          ligands: [{ id: 'ASP', smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O', predict_affinity: true }],
          recycling_steps: 3, sampling_steps: 50,
        }),
        assertions: [
          `AssertionBuilder.statusCode().equals(200)`,
          `AssertionBuilder.responseTime().lessThan(30000)`,
        ],
      };
  }
}

function toLogicalId(prefix, modelId) {
  const slug = modelId.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `${prefix}-${slug}`;
}

function labelOf(type) {
  return { chat: '🤖', vision: '👁️', embedding: '📐', rerank: '🔍', tts: '🔊', stt: '🎙️', protein: '🧬' }[type] || '📦';
}

function generateCheck(model, prefix, siteTag, baseVar) {
  const req       = buildRequest(model, baseVar);
  const logicId   = toLogicalId(prefix, model.id);
  return `
new ApiCheck('${logicId}', {
  name:      '${labelOf(model.type)} [${prefix.toUpperCase()}] ${model.id}',
  activated: true,
  frequency: Frequency.EVERY_1H,
  locations: ['ap-southeast-1'],
  tags:      ['fpt', '${siteTag}', '${model.type}'],
  degradedResponseTime: 5000,
  maxResponseTime:      30000,
  request: {
    method:  'POST',
    url:     \`${req.url}\`,
    headers: HEADERS_${prefix.toUpperCase()},
    body:    \`${req.body.replace(/`/g, '\\`')}\`,
    assertions: [
      ${req.assertions.join(',\n      ')},
    ],
  },
});`.trim();
}

// ── Main ──────────────────────────────────────────────────────────────────────

const activeVN = MODELS_VN.filter(m => !m.skip);
const activeJP = MODELS_JP.filter(m => !m.skip);

console.log(`\n📋 VN site: ${activeVN.length} active (${MODELS_VN.filter(m=>m.skip).length} skipped)`);
console.log(`📋 JP site: ${activeJP.length} active (${MODELS_JP.filter(m=>m.skip).length} skipped)`);
console.log(`📋 Total:   ${activeVN.length + activeJP.length} checks\n`);

const vnChecks = activeVN.map(m => generateCheck(m, 'vn', 'vn', 'BASE_VN')).join('\n\n');
const jpChecks = activeJP.map(m => generateCheck(m, 'jp', 'jp', 'BASE_JP')).join('\n\n');

const output = `/**
 * fpt-api-health.check.js
 * AUTO-GENERATED by utils/generate-checkly-checks.js
 * Date: ${new Date().toISOString()}
 * VN: ${activeVN.length} active | JP: ${activeJP.length} active
 *
 * To regenerate: node utils/generate-checkly-checks.js
 * To deploy:     npx checkly deploy --force
 */

const { ApiCheck, AssertionBuilder, Frequency } = require('checkly/constructs');

const BASE_VN = process.env.FPT_API_URL    || 'https://mkp-api.fptcloud.com';
const BASE_JP = process.env.FPT_JP_API_URL || 'https://mkp-api.fptcloud.jp';
const FROM    = process.env.FPT_FROM       || 'thuanlt9';

const HEADERS_VN = [
  { key: 'Content-Type',  value: 'application/json' },
  { key: 'Authorization', value: 'Bearer {{FPT_API_KEY}}' },
];
const HEADERS_JP = [
  { key: 'Content-Type',  value: 'application/json' },
  { key: 'Authorization', value: 'Bearer {{FPT_JP_API_KEY}}' },
];

// ═══════════════════════════════════════════════════
//  VN SITE — mkp-api.fptcloud.com
// ═══════════════════════════════════════════════════

${vnChecks}

// ═══════════════════════════════════════════════════
//  JP SITE — mkp-api.fptcloud.jp
// ═══════════════════════════════════════════════════

${jpChecks}
`;

const outFile = path.resolve(__dirname, '../checkly/api/fpt-api-health.check.js');
fs.writeFileSync(outFile, output, 'utf-8');
console.log(`✅ Generated: ${outFile}`);
console.log(`   VN: ${activeVN.length} checks | JP: ${activeJP.length} checks | Total: ${activeVN.length + activeJP.length}\n`);
console.log('👉 Next: npx checkly deploy --force\n');
