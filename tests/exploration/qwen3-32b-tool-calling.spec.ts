// qwen3-32b-tool-calling.spec.ts
// Exploration: Qwen3-32B — STG — long prompt + tool calling + streaming
// Run: APP_ENV=stg npx playwright test tests/exploration/qwen3-32b-tool-calling.spec.ts --project=exploration
import { test, expect } from '@playwright/test';

const BASE  = 'https://mkp-api-stg.fptcloud.net';
const KEY   = 'sk-fWgacpSLOtdTkSj3FLW9I805MWdzvwpAj784FZBEUko=';
const MODEL = 'Qwen3-32B';
const URL   = `${BASE}/v1/chat/completions`;

const HEADERS = {
  'Content-Type':  'application/json',
  'Authorization': `Bearer ${KEY}`,
};

const LONG_PROMPT = `Please analyze this comprehensive 3000-token technical document about AI model performance benchmarking and provide a detailed 1000-token summary covering key metrics, methodologies, and conclusions. \n\nDocument content (Section 1): Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\nSection 2: Performance metrics include latency (ms), throughput (tokens/sec), perplexity scores across datasets like WikiText-2, C4, and custom Vietnamese corpora. Model Qwen3-32B shows 245 tokens/sec on A100 GPU with batch size 8. Temperature effects: 0.7 optimal balance creativity/accuracy. Top-p 0.9 reduces hallucinations by 23%.\n\nSection 3: [Repeated expansion block x25]: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Tokenization uses BPE with 152k vocab size. Context window: 32k tokens effective. Fine-tuning on Vietnamese data improves BLEU by 12.4 points.\n\nSection 4: Tool calling benchmarks - get_weather function accuracy 98.7% across 5k calls. Streaming latency <50ms initial chunk. Presence penalty 0.1 optimal for long-form generation. Frequency penalty prevents repetition in 95% cases. Multi-turn conversation memory retention: 87% after 20 exchanges.\n\nSection 5: Hardware requirements - 80GB VRAM minimum for FP16, 40GB with quantization. Inference optimization: FlashAttention-2 speeds up 1.8x. Model merging techniques preserve 96% capability. Deployment: vLLM serving at 300 req/min.\n\nSection 6: Error analysis - 3.2% tool call failures due to ambiguous params. Hallucination rate 1.8% on factual queries. Vietnamese token efficiency 1.4x English. Cost analysis: $0.23/M tokens inference.\n\nSection 7: Future work - MoE integration, longer context, multimodal tools. Comparative table vs Llama3-70B, Mixtral-8x22B included. [Additional repeated methodology blocks x15 to reach exact ~3000 total tokens]`;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get current weather in a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: "City name, e.g., 'Hanoi'" },
          unit:     { type: 'string', enum: ['celsius', 'fahrenheit'] },
        },
        required: ['location'],
      },
    },
  },
];

const REQUEST_BODY = {
  model:             MODEL,
  messages:          [{ role: 'user', content: LONG_PROMPT }],
  tools:             TOOLS,
  tool_choice:       'auto',
  streaming:         true,
  temperature:       0.7,
  max_tokens:        1024,
  top_p:             0.9,
  top_k:             -1,
  presence_penalty:  0,
  frequency_penalty: 0,
};

test.describe(`Exploration — ${MODEL} @ STG (long prompt + tool_calling)`, () => {

  test('EX_001 — long prompt, tool_choice=auto, streaming=true', async ({ request }) => {
    console.log(`\n📡 POST ${URL}`);
    console.log(`   model=${MODEL} | max_tokens=1024 | streaming=true | tool_choice=auto`);

    const t0  = Date.now();
    const res = await request.post(URL, {
      headers: HEADERS,
      data:    REQUEST_BODY,
      timeout: 120_000,
    });
    const latencyMs = Date.now() - t0;

    console.log(`   HTTP ${res.status()} | ${latencyMs}ms`);
    if (res.status() !== 200) {
      const errBody = await res.text();
      console.log(`   Error body: ${errBody}`);
    }
    expect(res.status(), 'Expected HTTP 200').toBe(200);

    const body = await res.json();

    // ── Response structure ────────────────────────────────────────────────
    expect(body, 'Missing id').toHaveProperty('id');
    expect(body, 'Missing choices').toHaveProperty('choices');
    expect(body.choices.length, 'choices is empty').toBeGreaterThan(0);

    const choice  = body.choices[0];
    const message = choice.message ?? choice.delta ?? {};
    const content    = message.content    ?? '';
    const toolCalls  = message.tool_calls ?? [];
    const finishReason = choice.finish_reason ?? '';

    // ── Must have content OR tool_calls ───────────────────────────────────
    const hasContent   = typeof content === 'string' && content.length > 0;
    const hasToolCalls = Array.isArray(toolCalls) && toolCalls.length > 0;
    expect(
      hasContent || hasToolCalls,
      `Response has neither content nor tool_calls. finish_reason=${finishReason}`,
    ).toBe(true);

    // ── Usage tokens ──────────────────────────────────────────────────────
    const usage = body.usage ?? {};
    const promptTok  = usage.prompt_tokens     ?? 0;
    const compTok    = usage.completion_tokens ?? 0;
    const tokPerSec  = compTok > 0 ? (compTok / (latencyMs / 1000)).toFixed(1) : 'n/a';

    // ── Print result ──────────────────────────────────────────────────────
    if (hasToolCalls) {
      console.log(`\n✅ Response type   : tool_calls`);
      toolCalls.forEach((tc: any, i: number) => {
        console.log(`   [${i}] function     : ${tc.function?.name}`);
        console.log(`       arguments    : ${tc.function?.arguments}`);
      });
    } else {
      // Strip <think>...</think> for clean preview
      const thinkStripped = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      const hasThink = /<think>/i.test(content);
      console.log(`\n✅ Response type   : content`);
      if (hasThink) console.log(`   <think> block  : present (chain-of-thought)`);
      console.log(`   Preview        : "${thinkStripped.slice(0, 120)}..."`);
    }

    console.log(`\n   finish_reason  : ${finishReason}`);
    console.log(`   prompt tokens  : ${promptTok}`);
    console.log(`   completion tok : ${compTok}`);
    console.log(`   tokens/sec     : ${tokPerSec}`);
    console.log(`   latency        : ${latencyMs}ms`);
  });

});
