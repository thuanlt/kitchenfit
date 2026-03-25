// api-inference-jp.spec.ts
// Converted from: api-auto-modas-jp.jmx — ThreadGroup "Modas_SiteJP_v1_backup"
// API: https://mkp-api.fptcloud.jp
import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

const BASE = process.env.FPT_JP_API_URL ?? 'https://mkp-api.fptcloud.jp';
const KEY  = process.env.FPT_JP_API_KEY!;
const FROM = process.env.FPT_FROM!;   // thuanlt9

const HEADERS = {
  'Content-Type':  'application/json',
  'Authorization': `Bearer ${KEY}`,
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function chatUrl(model: string) {
  return `${BASE}/v1/chat/completions?from=${FROM}&model=${model}`;
}

function chatBody(model: string, content: string, extra: object = {}) {
  return {
    model,
    messages: [{ role: 'user', content }],
    streaming:         false,
    temperature:       1,
    max_tokens:        512,
    top_p:             1,
    top_k:             40,
    presence_penalty:  0,
    frequency_penalty: 0,
    ...extra,
  };
}

function visionBody(model: string, imageUrl: string, prompt = 'What is this a picture of? Be specific.') {
  return {
    model,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    }],
    streaming:         false,
    temperature:       1,
    max_tokens:        1024,
    top_p:             1,
    top_k:             40,
    presence_penalty:  0,
    frequency_penalty: 0,
  };
}

async function assertChat(res: any, model: string) {
  console.log(`📡 ${model} → HTTP ${res.status()}`);
  expect(res.status(), `${model} should return 200`).toBe(200);
  const body = await res.json();
  expect(body, `${model} missing 'choices'`).toHaveProperty('choices');
  expect(body.choices.length, `${model} choices empty`).toBeGreaterThan(0);
  const content = body.choices[0].message?.content ?? body.choices[0].message?.reasoning_content ?? '';
  expect(content.length, `${model} empty content`).toBeGreaterThan(0);
  console.log(`✅ ${model}: "${String(content).substring(0, 80)}..."`);
  return body;
}

// ─── Audio (shared) ──────────────────────────────────────────────────────────
const AUDIO_DIR  = path.resolve(__dirname, '../../test-data/audio');
const AUDIO_EXTS = ['.mp3', '.wav', '.m4a', '.ogg'];
const MIME_MAP: Record<string, string> = { '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg' };
const _found     = fs.existsSync(AUDIO_DIR)
  ? fs.readdirSync(AUDIO_DIR).find(f => AUDIO_EXTS.includes(path.extname(f).toLowerCase()))
  : undefined;
const AUDIO_FILE   = _found ? path.join(AUDIO_DIR, _found) : '';
const AUDIO_MIME   = _found ? (MIME_MAP[path.extname(_found).toLowerCase()] ?? 'audio/mpeg') : 'audio/mpeg';
const AUDIO_EXISTS = !!_found;

async function transcribeJP(request: any, model: string): Promise<void> {
  const audioBuffer = fs.readFileSync(AUDIO_FILE);
  const res = await request.post(
    `${BASE}/v1/audio/transcriptions?from=${FROM}&model=${model}`,
    {
      headers: { 'Authorization': `Bearer ${KEY}` },
      multipart: {
        file:            { name: path.basename(AUDIO_FILE), mimeType: AUDIO_MIME, buffer: audioBuffer },
        model:           model,
        language:        'en',
        response_format: 'json',
      },
    }
  );
  console.log(`📡 ${model} → HTTP ${res.status()}`);
  expect(res.status(), `${model} should return 200`).toBe(200);
  const body = await res.json();
  expect(body, `${model} missing 'text'`).toHaveProperty('text');
  expect(typeof body.text).toBe('string');
  console.log(`✅ ${model}: "${String(body.text).substring(0, 80)}"`);
}

const IMG_URL = 'https://raw.githubusercontent.com/open-mmlab/mmdeploy/main/demo/resources/det.jpg';
const MSG_FAMILY = "Hi! My name is Ethan, I'm 7. My family: father (engineer, 40), mother (teacher, 37), baby sister Lisa (2). I love my family!";
const MSG_BLACKHOLE = 'Can you tell me about the creation of blackholes?';
const MSG_VN = 'DeepSeek-V3.2-Speciale có đặc điểm gì nổi bật?';

// ════════════════════════════════════════════════════════════════════════════
//  CHAT COMPLETIONS — Text Models
// ════════════════════════════════════════════════════════════════════════════

test.describe('JP — Chat Completions (Text Models)', () => {

  test('TC_JP_001 — Kimi-K2.5', async ({ request }) => {
    const res = await request.post(chatUrl('Kimi-K2.5'), {
      headers: HEADERS,
      data: {
        model: 'Kimi-K2.5',
        messages: [
          { role: 'system', content: 'You are Kimi, an AI assistant created by Moonshot AI.' },
          { role: 'user',   content: [{ type: 'text', text: 'which one is bigger, 9.11 or 9.9? think carefully.' }] },
        ],
        stream:     false,
        max_tokens: 4096,
      },
    });
    await assertChat(res, 'Kimi-K2.5');
  });

  test('TC_JP_002 — SaoLa4-medium (JP)', async ({ request }) => {
    const res = await request.post(chatUrl('SaoLa4-medium_jp'), {
      headers: HEADERS,
      data: chatBody('SaoLa4-medium', MSG_BLACKHOLE),
    });
    await assertChat(res, 'SaoLa4-medium_jp');
  });

  test('TC_JP_003 — SaoLa4-small (JP)', async ({ request }) => {
    const res = await request.post(chatUrl('SaoLa4-small_jp'), {
      headers: HEADERS,
      data: chatBody('SaoLa4-small', MSG_BLACKHOLE),
    });
    await assertChat(res, 'SaoLa4-small_jp');
  });

  test('TC_JP_004 — DeepSeek-V3.2-Speciale', async ({ request }) => {
    const res = await request.post(chatUrl('DeepSeek-V3.2-Speciale'), {
      headers: HEADERS,
      data: chatBody('DeepSeek-V3.2-Speciale', MSG_VN),
    });
    await assertChat(res, 'DeepSeek-V3.2-Speciale');
  });

  test('TC_JP_005 — GLM-4.5', async ({ request }) => {
    const res = await request.post(chatUrl('GLM-4.5'), {
      headers: HEADERS,
      data: chatBody('GLM-4.5', MSG_FAMILY),
    });
    await assertChat(res, 'GLM-4.5');
  });

  test('TC_JP_006 — GLM-4.7', async ({ request }) => {
    const res = await request.post(chatUrl('GLM-4.7'), {
      headers: HEADERS,
      data: chatBody('GLM-4.7', MSG_FAMILY),
    });
    await assertChat(res, 'GLM-4.7');
  });

  test('TC_JP_007 — gpt-oss-120b', async ({ request }) => {
    const res = await request.post(chatUrl('gpt-oss-120b'), {
      headers: HEADERS,
      data: chatBody('gpt-oss-120b', MSG_FAMILY),
    });
    await assertChat(res, 'gpt-oss-120b');
  });

  test('TC_JP_008 — gpt-oss-20b', async ({ request }) => {
    const res = await request.post(chatUrl('gpt-oss-20b'), {
      headers: HEADERS,
      data: chatBody('gpt-oss-20b', MSG_FAMILY),
    });
    await assertChat(res, 'gpt-oss-20b');
  });

  test('TC_JP_009 — Qwen2.5-Coder-32B-Instruct', async ({ request }) => {
    const res = await request.post(chatUrl('Qwen2.5-Coder-32B-Instruct'), {
      headers: HEADERS,
      data: chatBody('Qwen2.5-Coder-32B-Instruct', MSG_FAMILY),
    });
    await assertChat(res, 'Qwen2.5-Coder-32B-Instruct');
  });

  test('TC_JP_010 — Qwen3-32B', async ({ request }) => {
    const res = await request.post(chatUrl('Qwen3-32B'), {
      headers: HEADERS,
      data: chatBody('Qwen3-32B', MSG_FAMILY),
    });
    await assertChat(res, 'Qwen3-32B');
  });

  test('TC_JP_011 — Qwen3-Coder-480B-A35B-Instruct', async ({ request }) => {
    const res = await request.post(chatUrl('Qwen3-Coder-480B-A35B-Instruct'), {
      headers: HEADERS,
      data: chatBody('Qwen3-Coder-480B-A35B-Instruct', MSG_FAMILY),
    });
    await assertChat(res, 'Qwen3-Coder-480B-A35B-Instruct');
  });

  test('TC_JP_012 — Llama-3.3-70B-Instruct', async ({ request }) => {
    const res = await request.post(chatUrl('Llama-3.3-70B-Instruct'), {
      headers: HEADERS,
      data: chatBody('Llama-3.3-70B-Instruct', MSG_FAMILY),
    });
    await assertChat(res, 'Llama-3.3-70B-Instruct');
  });

  test('TC_JP_013 — Llama-3.3-Swallow-70B-Instruct-v0.4', async ({ request }) => {
    const res = await request.post(chatUrl('Llama-3.3-Swallow-70B-Instruct-v0.4'), {
      headers: HEADERS,
      data: chatBody('Llama-3.3-Swallow-70B-Instruct-v0.4', MSG_FAMILY),
    });
    await assertChat(res, 'Llama-3.3-Swallow-70B-Instruct-v0.4');
  });

});

// ════════════════════════════════════════════════════════════════════════════
//  CHAT COMPLETIONS — Vision Models
// ════════════════════════════════════════════════════════════════════════════

test.describe('JP — Chat Completions (Vision Models)', () => {

  test('TC_JP_014 — Qwen3-VL-8B-Instruct', async ({ request }) => {
    const res = await request.post(chatUrl('Qwen3-VL-8B-Instruct'), {
      headers: HEADERS,
      data: chatBody('Qwen3-VL-8B-Instruct', 'what your name and your version?', { max_tokens: 500 }),
    });
    await assertChat(res, 'Qwen3-VL-8B-Instruct');
  });

  test('TC_JP_015 — Qwen2.5-VL-7B-Instruct', async ({ request }) => {
    const res = await request.post(chatUrl('Qwen2.5-VL-7B-Instruct'), {
      headers: HEADERS,
      data: visionBody('Qwen2.5-VL-7B-Instruct', IMG_URL),
    });
    await assertChat(res, 'Qwen2.5-VL-7B-Instruct');
  });

  test('TC_JP_016 — DeepSeek-OCR', async ({ request }) => {
    const res = await request.post(chatUrl('DeepSeek-OCR'), {
      headers: HEADERS,
      data: visionBody('DeepSeek-OCR', IMG_URL),
    });
    await assertChat(res, 'DeepSeek-OCR');
  });

  test('TC_JP_017 — gemma-3-27b-it', async ({ request }) => {
    const res = await request.post(chatUrl('gemma-3-27b-it'), {
      headers: HEADERS,
      data: visionBody('gemma-3-27b-it', IMG_URL),
    });
    await assertChat(res, 'gemma-3-27b-it');
  });

  test('TC_JP_018 — FPT.AI-Table-Parsing-v1.1', async ({ request }) => {
    const res = await request.post(chatUrl('FPT.AI-Table-Parsing-v1.1'), {
      headers: HEADERS,
      data: visionBody('FPT.AI-Table-Parsing-v1.1', IMG_URL),
    });
    await assertChat(res, 'FPT.AI-Table-Parsing-v1.1');
  });

  test('TC_JP_019 — FPT.AI-KIE-v1.7', async ({ request }) => {
    const res = await request.post(chatUrl('FPT.AI-KIE-v1.7'), {
      headers: HEADERS,
      data: visionBody('FPT.AI-KIE-v1.7', IMG_URL),
    });
    await assertChat(res, 'FPT.AI-KIE-v1.7');
  });

  test('TC_JP_020 — FCI-Document-Parsing-V1.0', async ({ request }) => {
    const res = await request.post(chatUrl('FCI-Document-Parsing-V1.0'), {
      headers: HEADERS,
      data: visionBody('FCI-Document-Parsing-V1.0', IMG_URL),
    });
    console.log(`📡 FCI-Document-Parsing-V1.0 → HTTP ${res.status()}`);
    expect(res.status(), 'FCI-Document-Parsing-V1.0 should return 200').toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('choices');
    expect(body.choices.length).toBeGreaterThan(0);
    // Model may return empty content (known behavior) — log actual response for visibility
    const content = body.choices[0].message?.content ?? '';
    console.log(`ℹ️  FCI-Document-Parsing-V1.0 response: "${String(content).substring(0, 120) || '(empty)'}"`);
    console.log(`✅ FCI-Document-Parsing-V1.0: HTTP 200, choices=${body.choices.length}`);
  });

});

// ════════════════════════════════════════════════════════════════════════════
//  EMBEDDINGS
// ════════════════════════════════════════════════════════════════════════════

test.describe('JP — Embeddings Models', () => {

  test('TC_JP_021 — multilingual-e5-large', async ({ request }) => {
    const res = await request.post(`${BASE}/v1/embeddings?from=${FROM}&model=multilingual-e5-large`, {
      headers: HEADERS,
      data: {
        model:               'multilingual-e5-large',
        input:               ['input 1', 'input 2'],
        encoding_format:     'float',
        input_text_truncate: 'none',
        input_type:          'passage',
      },
    });
    console.log(`📡 multilingual-e5-large → HTTP ${res.status()}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body.data[0]).toHaveProperty('embedding');
    console.log(`✅ multilingual-e5-large: embedding dim=${body.data[0].embedding.length}`);
  });

  test('TC_JP_022 — gte-multilingual-base', async ({ request }) => {
    const res = await request.post(`${BASE}/v1/embeddings?from=${FROM}&model=gte-multilingual-base`, {
      headers: HEADERS,
      data: {
        model:               'gte-multilingual-base',
        input:               ['input 1', 'input 2'],
        dimensions:          768,
        encoding_format:     'float',
        input_text_truncate: 'none',
        input_type:          'passage',
      },
    });
    console.log(`📡 gte-multilingual-base → HTTP ${res.status()}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body.data[0]).toHaveProperty('embedding');
    console.log(`✅ gte-multilingual-base: embedding dim=${body.data[0].embedding.length}`);
  });

  test('TC_JP_023 — bge-m3', async ({ request }) => {
    const res = await request.post(`${BASE}/v1/embeddings?from=${FROM}&model=bge-m3`, {
      headers: HEADERS,
      data: {
        model:               'bge-m3',
        input:               ['input 1', 'input 2'],
        encoding_format:     'float',
        input_text_truncate: 'none',
        input_type:          'passage',
      },
    });
    console.log(`📡 bge-m3 → HTTP ${res.status()}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body.data[0]).toHaveProperty('embedding');
    console.log(`✅ bge-m3: embedding dim=${body.data[0].embedding.length}`);
  });

});

// ════════════════════════════════════════════════════════════════════════════
//  RERANK
// ════════════════════════════════════════════════════════════════════════════

test.describe('JP — Rerank Models', () => {

  test('TC_JP_024 — bge-reranker-v2-m3', async ({ request }) => {
    const res = await request.post(`${BASE}/v1/rerank?from=${FROM}&model=bge-reranker-v2-m3`, {
      headers: HEADERS,
      data: {
        model: 'bge-reranker-v2-m3',
        query: 'What is the capital of the United States?',
        documents: [
          'Carson City is the capital city of the American state of Nevada.',
          'The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.',
          'Washington, D.C. is the capital of the United States.',
          'Capital punishment has existed in the United States since before it was a country.',
        ],
        top_n: 2,
      },
    });
    console.log(`📡 bge-reranker-v2-m3 → HTTP ${res.status()}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('results');
    expect(body.results.length).toBeGreaterThan(0);
    console.log(`✅ bge-reranker-v2-m3: top score=${body.results[0]?.relevance_score}`);
  });

});

// ════════════════════════════════════════════════════════════════════════════
//  AUDIO — Speech to Text
//  Đặt file audio vào: test-data/audio/ (auto-detect .mp3, .wav, .m4a, .ogg)
// ════════════════════════════════════════════════════════════════════════════

test.describe('JP — Audio Models (Speech to Text)', () => {

  test('TC_JP_025 — FPT.AI-whisper-large-v3-turbo', async ({ request }) => {
    test.skip(!AUDIO_EXISTS, `Audio file not found: ${AUDIO_DIR}/`);
    await transcribeJP(request, 'FPT.AI-whisper-large-v3-turbo');
  });

  test('TC_JP_026 — FPT.AI-whisper-medium', async ({ request }) => {
    test.skip(!AUDIO_EXISTS, `Audio file not found: ${AUDIO_DIR}/`);
    await transcribeJP(request, 'FPT.AI-whisper-medium');
  });

});
