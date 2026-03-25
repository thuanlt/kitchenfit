// api-inference.spec.ts
// Converted from: call_api_key.jmx — ThreadGroup "Modas_SiteVN_v1"
// API: https://mkp-api.fptcloud.com  |  Auth: Bearer sk-mF8Mxq-X4mrZzGuOL5uY4A
import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

const BASE  = process.env.FPT_API_URL!;   // https://mkp-api.fptcloud.com
const KEY   = process.env.FPT_API_KEY!;   // sk-mF8Mxq-X4mrZzGuOL5uY4A
const FROM  = process.env.FPT_FROM!;      // thuanlt9

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

async function assertChat(res: any, model: string) {
  console.log(`📡 ${model} → HTTP ${res.status()}`);
  expect(res.status(), `${model} should return 200`).toBe(200);
  const body = await res.json();
  expect(body, `${model} missing 'choices'`).toHaveProperty('choices');
  expect(body.choices.length, `${model} choices empty`).toBeGreaterThan(0);
  const content = body.choices[0].message?.content ?? body.choices[0].message?.reasoning_content ?? '';
  expect(content.length, `${model} empty content`).toBeGreaterThan(0);
  console.log(`✅ ${model}: "${content.substring(0, 80)}..."`);
  return body;
}

const MSG_SHORT  = 'Hi, what is your name and version?';
const MSG_FAMILY = "Hi! My name is Ethan, I'm 7. My family: father (engineer, 40), mother (teacher, 37), baby sister Lisa (2). I love my family!";
const MSG_VN     = 'DeepSeek-V3.2-Speciale có đặc điểm gì nổi bật?';

// ════════════════════════════════════════════════════════════════════════════
//  CHAT COMPLETIONS — Text Models
// ════════════════════════════════════════════════════════════════════════════

test.describe('Chat Completions — VN Site (Modas_SiteVN_v1)', () => {

  test('TC_API_001 — DeepSeek-V3.2-Speciale', async ({ request }) => {
    const res = await request.post(chatUrl('DeepSeek-V3.2-Speciale'), {
      headers: HEADERS,
      data: chatBody('DeepSeek-V3.2-Speciale', MSG_VN),
    });
    await assertChat(res, 'DeepSeek-V3.2-Speciale');
  });

  test('TC_API_002 — GLM-4.5', async ({ request }) => {
    const res = await request.post(chatUrl('GLM-4.5'), {
      headers: HEADERS,
      data: chatBody('GLM-4.5', MSG_FAMILY),
    });
    await assertChat(res, 'GLM-4.5');
  });

  test('TC_API_003 — GLM-4.7', async ({ request }) => {
    const res = await request.post(chatUrl('GLM-4.7'), {
      headers: HEADERS,
      data: chatBody('GLM-4.7', MSG_FAMILY),
    });
    await assertChat(res, 'GLM-4.7');
  });

  test('TC_API_004 — gpt-oss-120b', async ({ request }) => {
    const res = await request.post(chatUrl('gpt-oss-120b'), {
      headers: HEADERS,
      data: chatBody('gpt-oss-120b', MSG_FAMILY),
    });
    await assertChat(res, 'gpt-oss-120b');
  });

  test('TC_API_005 — gpt-oss-20b', async ({ request }) => {
    const res = await request.post(chatUrl('gpt-oss-20b'), {
      headers: HEADERS,
      data: chatBody('gpt-oss-20b', MSG_FAMILY),
    });
    await assertChat(res, 'gpt-oss-20b');
  });

  test('TC_API_006 — Qwen2.5-Coder-32B-Instruct', async ({ request }) => {
    const res = await request.post(chatUrl('Qwen2.5-Coder-32B-Instruct'), {
      headers: HEADERS,
      data: chatBody('Qwen2.5-Coder-32B-Instruct', MSG_FAMILY),
    });
    await assertChat(res, 'Qwen2.5-Coder-32B-Instruct');
  });

  test('TC_API_007 — Qwen3-32B', async ({ request }) => {
    const res = await request.post(chatUrl('Qwen3-32B'), {
      headers: HEADERS,
      data: chatBody('Qwen3-32B', MSG_FAMILY),
    });
    await assertChat(res, 'Qwen3-32B');
  });

  test('TC_API_008 — Qwen3-Coder-480B-A35B-Instruct', async ({ request }) => {
    const res = await request.post(chatUrl('Qwen3-Coder-480B-A35B-Instruct'), {
      headers: HEADERS,
      data: chatBody('Qwen3-Coder-480B-A35B-Instruct', MSG_FAMILY),
    });
    await assertChat(res, 'Qwen3-Coder-480B-A35B-Instruct');
  });

  test('TC_API_009 — gemma-3-27b-it', async ({ request }) => {
    const res = await request.post(chatUrl('gemma-3-27b-it'), {
      headers: HEADERS,
      data: chatBody('gemma-3-27b-it', MSG_FAMILY),
    });
    await assertChat(res, 'gemma-3-27b-it');
  });

  test('TC_API_010 — SaoLa3.1-medium', async ({ request }) => {
    const res = await request.post(chatUrl('SaoLa3.1-medium'), {
      headers: HEADERS,
      data: chatBody('SaoLa3.1-medium', MSG_SHORT),
    });
    await assertChat(res, 'SaoLa3.1-medium');
  });

  test('TC_API_011 — SaoLa-Llama3.1-planner', async ({ request }) => {
    const res = await request.post(chatUrl('SaoLa-Llama3.1-planner'), {
      headers: HEADERS,
      data: chatBody('SaoLa-Llama3.1-planner', MSG_SHORT),
    });
    await assertChat(res, 'SaoLa-Llama3.1-planner');
  });

  test('TC_API_012 — Llama-3.3-70B-Instruct', async ({ request }) => {
    const res = await request.post(chatUrl('Llama-3.3-70B-Instruct'), {
      headers: HEADERS,
      data: chatBody('Llama-3.3-70B-Instruct', MSG_FAMILY),
    });
    await assertChat(res, 'Llama-3.3-70B-Instruct');
  });

  test('TC_API_013 — Llama-3.3-Swallow-70B-Instruct-v0.4', async ({ request }) => {
    const res = await request.post(chatUrl('Llama-3.3-Swallow-70B-Instruct-v0.4'), {
      headers: HEADERS,
      data: chatBody('Llama-3.3-Swallow-70B-Instruct-v0.4', MSG_FAMILY),
    });
    await assertChat(res, 'Llama-3.3-Swallow-70B-Instruct-v0.4');
  });

  test('TC_API_014 — Kimi-K2.5', async ({ request }) => {
    const res = await request.post(chatUrl('Kimi-K2.5'), {
      headers: HEADERS,
      data: chatBody('Kimi-K2.5', MSG_SHORT),
    });
    await assertChat(res, 'Kimi-K2.5');
  });

  test('TC_API_015 — SaoLa4-medium', async ({ request }) => {
    const res = await request.post(chatUrl('SaoLa4-medium'), {
      headers: HEADERS,
      data: chatBody('SaoLa4-medium', MSG_SHORT),
    });
    await assertChat(res, 'SaoLa4-medium');
  });

  test('TC_API_016 — SaoLa4-small', async ({ request }) => {
    const res = await request.post(chatUrl('SaoLa4-small'), {
      headers: HEADERS,
      data: chatBody('SaoLa4-small', MSG_SHORT),
    });
    await assertChat(res, 'SaoLa4-small');
  });

});

// ════════════════════════════════════════════════════════════════════════════
//  CHAT COMPLETIONS — Vision / Multimodal Models
// ════════════════════════════════════════════════════════════════════════════

test.describe('Chat Completions — Vision Models', () => {

  test('TC_API_018 — Qwen3-VL-8B-Instruct', async ({ request }) => {
    const res = await request.post(chatUrl('Qwen3-VL-8B-Instruct'), {
      headers: HEADERS,
      data: chatBody('Qwen3-VL-8B-Instruct', MSG_SHORT),
    });
    await assertChat(res, 'Qwen3-VL-8B-Instruct');
  });

  test('TC_API_019 — Qwen2.5-VL-7B-Instruct', async ({ request }) => {
    const res = await request.post(chatUrl('Qwen2.5-VL-7B-Instruct'), {
      headers: HEADERS,
      data: chatBody('Qwen2.5-VL-7B-Instruct', MSG_SHORT),
    });
    await assertChat(res, 'Qwen2.5-VL-7B-Instruct');
  });

  test('TC_API_020 — DeepSeek-OCR (with image URL)', async ({ request }) => {
    const res = await request.post(chatUrl('DeepSeek-OCR'), {
      headers: HEADERS,
      data: {
        model: 'DeepSeek-OCR',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'What is this a picture of?' },
            { type: 'image_url', image_url: { url: 'https://raw.githubusercontent.com/open-mmlab/mmdeploy/main/demo/resources/det.jpg' } },
          ],
        }],
        streaming: false,
        temperature: 1,
        max_tokens: 512,
      },
    });
    await assertChat(res, 'DeepSeek-OCR');
  });

  test('TC_API_021 — FPT.AI-Table-Parsing-v1.1 (with image URL)', async ({ request }) => {
    const res = await request.post(chatUrl('FPT.AI-Table-Parsing-v1.1'), {
      headers: HEADERS,
      data: {
        model: 'FPT.AI-Table-Parsing-v1.1',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Parse this table.' },
            { type: 'image_url', image_url: { url: 'https://raw.githubusercontent.com/open-mmlab/mmdeploy/main/demo/resources/det.jpg' } },
          ],
        }],
        streaming: false,
        max_tokens: 512,
      },
    });
    await assertChat(res, 'FPT.AI-Table-Parsing-v1.1');
  });

  test('TC_API_022 — FPT.AI-KIE-v1.7 (with image URL)', async ({ request }) => {
    const res = await request.post(chatUrl('FPT.AI-KIE-v1.7'), {
      headers: HEADERS,
      data: {
        model: 'FPT.AI-KIE-v1.7',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Extract key information.' },
            { type: 'image_url', image_url: { url: 'https://raw.githubusercontent.com/open-mmlab/mmdeploy/main/demo/resources/det.jpg' } },
          ],
        }],
        streaming: false,
        max_tokens: 512,
      },
    });
    await assertChat(res, 'FPT.AI-KIE-v1.7');
  });

});

// ════════════════════════════════════════════════════════════════════════════
//  EMBEDDINGS
// ════════════════════════════════════════════════════════════════════════════

test.describe('Embeddings Models', () => {

  test('TC_API_023 — multilingual-e5-large', async ({ request }) => {
    const res = await request.post(`${BASE}/v1/embeddings?from=${FROM}&model=multilingual-e5-large`, {
      headers: HEADERS,
      data: { model: 'multilingual-e5-large', input: 'Hello world, this is a test sentence.' },
    });
    console.log(`📡 multilingual-e5-large → HTTP ${res.status()}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty('embedding');
    console.log(`✅ multilingual-e5-large: embedding dim=${body.data[0].embedding.length}`);
  });

  test('TC_API_024 — Vietnamese_Embedding', async ({ request }) => {
    const res = await request.post(`${BASE}/v1/embeddings?from=${FROM}&model=Vietnamese_Embedding`, {
      headers: HEADERS,
      data: { model: 'Vietnamese_Embedding', input: 'Xin chào, đây là câu kiểm tra tiếng Việt.' },
    });
    console.log(`📡 Vietnamese_Embedding → HTTP ${res.status()}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body.data[0]).toHaveProperty('embedding');
    console.log(`✅ Vietnamese_Embedding: embedding dim=${body.data[0].embedding.length}`);
  });

});

// ════════════════════════════════════════════════════════════════════════════
//  RERANK
// ════════════════════════════════════════════════════════════════════════════

test.describe('Rerank Models', () => {

  test('TC_API_025 — bge-reranker-v2-m3', async ({ request }) => {
    const res = await request.post(`${BASE}/v1/rerank?from=${FROM}&model=bge-reranker-v2-m3`, {
      headers: HEADERS,
      data: {
        model: 'bge-reranker-v2-m3',
        query: 'What is machine learning?',
        documents: [
          'Machine learning is a type of artificial intelligence.',
          'The weather today is sunny and warm.',
          'Deep learning uses neural networks with many layers.',
        ],
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
//  AUDIO — STT & TTS
//  Đặt file audio vào: test-data/audio/test.wav (hoặc .mp3, .m4a)
// ════════════════════════════════════════════════════════════════════════════

// Auto-detect audio file in test-data/audio/ (supports .mp3, .wav, .m4a, .ogg)
const AUDIO_DIR  = path.resolve(__dirname, '../../test-data/audio');
const AUDIO_EXTS = ['.mp3', '.wav', '.m4a', '.ogg'];
const MIME_MAP: Record<string, string> = { '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg' };
const _found     = fs.existsSync(AUDIO_DIR)
  ? fs.readdirSync(AUDIO_DIR).find(f => AUDIO_EXTS.includes(path.extname(f).toLowerCase()))
  : undefined;
const AUDIO_FILE   = _found ? path.join(AUDIO_DIR, _found) : '';
const AUDIO_MIME   = _found ? (MIME_MAP[path.extname(_found).toLowerCase()] ?? 'audio/mpeg') : 'audio/mpeg';
const AUDIO_EXISTS = !!_found;

// Helper: POST multipart /v1/audio/transcriptions
async function transcribe(request: any, model: string): Promise<void> {
  const audioBuffer = fs.readFileSync(AUDIO_FILE);
  const res = await request.post(
    `${BASE}/v1/audio/transcriptions?from=${FROM}&model=${model}`,
    {
      headers: { 'Authorization': `Bearer ${KEY}` },
      multipart: {
        file:  { name: path.basename(AUDIO_FILE), mimeType: AUDIO_MIME, buffer: audioBuffer },
        model: model,
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

test.describe('Audio Models — Speech to Text', () => {

  test('TC_API_026 — FPT.AI-whisper-large-v3-turbo', async ({ request }) => {
    test.skip(!AUDIO_EXISTS, `Audio file not found: ${AUDIO_FILE}`);
    await transcribe(request, 'FPT.AI-whisper-large-v3-turbo');
  });

  test('TC_API_027 — FPT.AI-whisper-medium', async ({ request }) => {
    test.skip(!AUDIO_EXISTS, `Audio file not found: ${AUDIO_FILE}`);
    await transcribe(request, 'FPT.AI-whisper-medium');
  });

  test('TC_API_028 — whisper-large-v3-turbo', async ({ request }) => {
    test.skip(!AUDIO_EXISTS, `Audio file not found: ${AUDIO_FILE}`);
    await transcribe(request, 'whisper-large-v3-turbo');
  });

});

test.describe('Audio Models — Text to Speech', () => {

  test('TC_API_029 — FPT.AI-VITs (TTS)', async ({ request }) => {
    const res = await request.post(
      `${BASE}/v1/audio/speech?from=${FROM}&model=FPT.AI-VITs`,
      {
        headers: { ...HEADERS },
        data: {
          model: 'FPT.AI-VITs',
          input: 'Xin chào, đây là bài kiểm tra văn bản thành giọng nói.',
          voice: 'alloy',
        },
      }
    );
    console.log(`📡 FPT.AI-VITs (TTS) → HTTP ${res.status()}`);
    if (res.status() !== 200) {
      const errBody = await res.text();
      console.log(`❌ TTS error response: ${errBody}`);
    }
    expect(res.status(), 'TTS should return 200').toBe(200);
    const buffer = await res.body();
    expect(buffer.length, 'TTS response body should not be empty').toBeGreaterThan(0);
    console.log(`✅ FPT.AI-VITs (TTS): received ${buffer.length} bytes`);
  });

});
