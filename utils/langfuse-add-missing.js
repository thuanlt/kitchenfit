require('dotenv').config();
const { ProxyAgent, fetch } = require('undici');

const PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY;
const SECRET_KEY = process.env.LANGFUSE_SECRET_KEY;
const BASE_URL   = process.env.LANGFUSE_BASE_URL ?? 'https://cloud.langfuse.com';
const PROXY      = process.env.LANGFUSE_HTTP_PROXY ?? process.env.HTTPS_PROXY;
const auth       = Buffer.from(`${PUBLIC_KEY}:${SECRET_KEY}`).toString('base64');
const fetchOpt   = PROXY ? { dispatcher: new ProxyAgent(PROXY) } : {};
const PER_M      = 1_000_000;

const MISSING = [
  { modelName: 'FPT.AI-whisper-medium',    inputPrice: 0.0165, outputPrice: 0 },
  { modelName: 'whisper-large-v3-turbo',   inputPrice: 0.0044, outputPrice: 0 },
];

async function addModel(m) {
  const safe = m.modelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const body = {
    modelName:    m.modelName,
    matchPattern: `(?i)^(${safe})$`,
    unit:         'TOKENS',
    inputPrice:   m.inputPrice  / PER_M,
    outputPrice:  m.outputPrice / PER_M,
  };
  const res = await fetch(`${BASE_URL}/api/public/models`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}` },
    body:    JSON.stringify(body),
    ...fetchOpt,
  });
  if (res.ok) {
    console.log(`✅ ${m.modelName}  in: $${m.inputPrice}/M`);
  } else {
    const txt = await res.text();
    console.log(`❌ ${m.modelName}: ${res.status} ${txt.substring(0, 80)}`);
  }
}

(async () => {
  for (const m of MISSING) {
    await new Promise(r => setTimeout(r, 4000));
    await addModel(m);
  }
  console.log('Done.');
})();
