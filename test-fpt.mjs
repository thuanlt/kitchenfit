import 'dotenv/config';
import OpenAI from 'openai';
import { ProxyAgent, fetch as undiciFetch } from 'undici';

const MODEL = 'GLM-4.7';
const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const proxyAgent = new ProxyAgent(proxy);

const client = new OpenAI({
  apiKey: process.env.FPT_API_KEY,
  baseURL: process.env.FPT_API_URL + '/v1',
  defaultQuery: { from: process.env.FPT_FROM, model: MODEL },
  timeout: 60000,
  fetch: (url, init) => undiciFetch(url, { ...init, dispatcher: proxyAgent }),
});

const res = await client.chat.completions.create({
  model: MODEL,
  messages: [{ role: 'user', content: 'Generate playwright test case for login page' }],
  max_tokens: 2048,
});

const msg = res.choices[0].message;
const content = msg.content ?? msg.reasoning_content ?? '';
console.log('✅ GLM-4.7 response:\n');
console.log(content);
