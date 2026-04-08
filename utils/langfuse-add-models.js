/**
 * langfuse-add-models.js
 * Tự động add tất cả FPT AI models + pricing vào Langfuse
 * Giá lấy từ: https://marketplace.fptcloud.com/en (trang pricing)
 *
 * Usage: node utils/langfuse-add-models.js
 */

require('dotenv').config();
const { ProxyAgent, fetch: undiciFetch } = require('undici');

const PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY;
const SECRET_KEY = process.env.LANGFUSE_SECRET_KEY;
const BASE_URL   = process.env.LANGFUSE_BASE_URL ?? 'https://cloud.langfuse.com';
const PROXY      = process.env.LANGFUSE_HTTP_PROXY ?? process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;

if (!PUBLIC_KEY || !SECRET_KEY) {
  console.error('❌ Missing LANGFUSE_PUBLIC_KEY or LANGFUSE_SECRET_KEY in .env');
  process.exit(1);
}

// Pricing đơn vị: USD / 1 triệu tokens → Langfuse nhận USD / 1 token
// nên chia cho 1_000_000
const PER_M = 1_000_000;

// ── FPT AI Model Pricing (từ marketplace.fptcloud.com/en) ─────────────────────
// inputPrice / outputPrice: USD per million tokens
const MODELS = [
  // ── Large Language Model ──────────────────────────────────────────────────
  { modelName: 'DeepSeek-R1',                        inputPrice: 0.649,   outputPrice: 2.739  },
  { modelName: 'DeepSeek-V3.2-Speciale',             inputPrice: 0.33,    outputPrice: 0.55   },
  { modelName: 'GLM-4.5',                            inputPrice: 0.66,    outputPrice: 2.2    },
  { modelName: 'GLM-4.7',                            inputPrice: 0.495,   outputPrice: 2.2    },
  { modelName: 'gpt-oss-120b',                       inputPrice: 0.143,   outputPrice: 0.605  },
  { modelName: 'gpt-oss-20b',                        inputPrice: 0.0495,  outputPrice: 0.198  },
  { modelName: 'Llama-3.3-70B-Instruct',             inputPrice: 0.209,   outputPrice: 0.451  },
  { modelName: 'Llama-3.3-Swallow-70B-Instruct-v0.4',inputPrice: 0.374,   outputPrice: 0.374  },
  { modelName: 'Qwen2.5-Coder-32B-Instruct',         inputPrice: 0.088,   outputPrice: 0.187  },
  { modelName: 'Qwen3-32B',                          inputPrice: 0.165,   outputPrice: 0.187  },
  { modelName: 'Qwen3-Coder-480B-A35B-Instruct',     inputPrice: 0.33,    outputPrice: 1.65   },
  { modelName: 'SaoLa-Llama3.1-planner',             inputPrice: 0.055,   outputPrice: 0.088  },
  { modelName: 'SaoLa3.1-medium',                    inputPrice: 0.165,   outputPrice: 0.187  },
  { modelName: 'SaoLa4-medium',                      inputPrice: 0.165,   outputPrice: 0.187  },
  { modelName: 'SaoLa4-small',                       inputPrice: 0.132,   outputPrice: 0.154  },
  // ── Hybrid MoE LLM ───────────────────────────────────────────────────────
  { modelName: 'Nemotron-3-Super-120B-A12B',         inputPrice: 0.44,    outputPrice: 0.88   },
  // ── Vision Language Model ─────────────────────────────────────────────────
  { modelName: 'DeepSeek-OCR',                       inputPrice: 0.044,   outputPrice: 0.132  },
  { modelName: 'FPT.AI-KIE-v1.7',                   inputPrice: 0.77,    outputPrice: 0.77   },
  { modelName: 'FPT.AI-Table-Parsing-v1.1',          inputPrice: 0.77,    outputPrice: 0.77   },
  { modelName: 'gemma-3-27b-it',                     inputPrice: 0.110,   outputPrice: 0.165  },
  { modelName: 'Kimi-K2.5',                          inputPrice: 0.495,   outputPrice: 2.75   },
  { modelName: 'Qwen2.5-VL-7B-Instruct',             inputPrice: 0.77,    outputPrice: 0.77   },
  { modelName: 'Qwen3-VL-8B-Instruct',               inputPrice: 0.198,   outputPrice: 0.759  },
  // ── Vision Language Action ────────────────────────────────────────────────
  { modelName: 'Alpamayo-R1-10B',                    inputPrice: 0,       outputPrice: 0      },
  // ── Text Embeddings ──────────────────────────────────────────────────────
  { modelName: 'multilingual-e5-large',              inputPrice: 0.022,   outputPrice: 0      },
  { modelName: 'Vietnamese_Embedding',               inputPrice: 0.011,   outputPrice: 0      },
  // ── Rerank ───────────────────────────────────────────────────────────────
  { modelName: 'bge-reranker-v2-m3',                 inputPrice: 0.022,   outputPrice: 0      },
  // ── Text to Speech ───────────────────────────────────────────────────────
  { modelName: 'FPT.AI-VITs',                        inputPrice: 16.5,    outputPrice: 0      },
  // ── Speech to Text (unit: per Minute → dùng TOKENS vì Langfuse không có Minute unit) ──
  { modelName: 'FPT.AI-whisper-large-v3-turbo',      inputPrice: 0.0297,  outputPrice: 0      },
  { modelName: 'FPT.AI-whisper-medium',              inputPrice: 0.0165,  outputPrice: 0      },
  { modelName: 'whisper-large-v3-turbo',             inputPrice: 0.0044,  outputPrice: 0      },
];

const auth     = Buffer.from(`${PUBLIC_KEY}:${SECRET_KEY}`).toString('base64');
const fetchOpt = PROXY ? { dispatcher: new ProxyAgent(PROXY) } : {};

async function addModel(model) {
  const body = {
    modelName:    model.modelName,
    matchPattern: `(?i)^(${model.modelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})$`,
    unit:         'TOKENS',
    inputPrice:   model.inputPrice  / PER_M,   // convert $/M → $/token
    outputPrice:  model.outputPrice / PER_M,
  };

  const res = await undiciFetch(`${BASE_URL}/api/public/models`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify(body),
    ...fetchOpt,
  });

  if (res.ok) {
    console.log(`✅ ${model.modelName.padEnd(42)} in: $${model.inputPrice}/M  out: $${model.outputPrice}/M`);
  } else {
    const err = await res.text();
    // 409 = already exists → skip silently
    if (res.status === 409) {
      console.log(`⏭️  ${model.modelName.padEnd(42)} already exists — skipped`);
    } else {
      console.warn(`❌ ${model.modelName}: ${res.status} ${err.substring(0, 100)}`);
    }
  }
}

async function main() {
  console.log(`\n🚀 Adding ${MODELS.length} FPT models to Langfuse...\n`);
  for (const m of MODELS) {
    await addModel(m);
  }
  console.log(`\n✅ Done! Open Langfuse → Settings → Models to verify.\n`);
}

main().catch(console.error);
