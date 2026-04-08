/**
 * tools/langfuse-client.ts
 * Singleton Langfuse instance + helpers để trace agent/model calls.
 *
 * Usage:
 *   import { langfuse, startAgentTrace, flushLangfuse } from '../tools/langfuse-client';
 */

import { Langfuse, observeOpenAI } from 'langfuse';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

// ── Proxy setup ───────────────────────────────────────────────────────────────
const PROXY = process.env.LANGFUSE_HTTP_PROXY ?? process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;
if (PROXY) {
  try {
    const { setGlobalDispatcher, ProxyAgent } = require('undici');
    setGlobalDispatcher(new ProxyAgent(PROXY));
  } catch { /* undici not available */ }
}

// ── Singleton ─────────────────────────────────────────────────────────────────
export const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY ?? '',
  secretKey: process.env.LANGFUSE_SECRET_KEY  ?? '',
  baseUrl:   process.env.LANGFUSE_BASE_URL ?? process.env.LANGFUSE_HOST ?? 'https://cloud.langfuse.com',
  enabled:   !!(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY),
});

// ── Wrap OpenAI-compatible client ─────────────────────────────────────────────
export function wrapWithLangfuse(client: OpenAI, options?: {
  generationName?: string;
  sessionId?:      string;
  traceId?:        string;
}) {
  return observeOpenAI(client, {
    generationName: options?.generationName ?? 'fpt-model-call',
    sessionId:      options?.sessionId,
    traceId:        options?.traceId,
  });
}

// ── Trace helpers ─────────────────────────────────────────────────────────────
export function startAgentTrace(name: string, input: Record<string, unknown>) {
  return langfuse.trace({
    name,
    input,
    sessionId: `session-${Date.now()}`,
    tags:      ['agent', 'fpt-marketplace'],
  });
}

export async function flushLangfuse() {
  await langfuse.flushAsync();
}
