/**
 * utils/config.ts
 *
 * Centralized configuration loader.
 * Reads APP_ENV (test | stg | prod) and merges:
 *   .env            ← shared / secret values (API keys, Jira, etc.)
 *   .env.<APP_ENV>  ← environment-specific overrides (BASE_URL, credentials)
 *
 * Used by:
 *   - Playwright test files (process.env.* is already populated by playwright.config.ts)
 *   - Standalone ts-node scripts (glm-generate-tests, jira-reporter, claude-glm-agent, …)
 */

import dotenv from 'dotenv';
import path from 'path';

const cwd = process.cwd();
export const APP_ENV = (process.env.APP_ENV ?? 'test') as 'test' | 'stg' | 'prod';

// Load base .env (shared secrets / defaults) — does NOT override existing vars
dotenv.config({ path: path.resolve(cwd, '.env') });

// Load environment-specific file — DOES override so it takes precedence
dotenv.config({ path: path.resolve(cwd, `.env.${APP_ENV}`), override: true });

// ─── Typed config object ───────────────────────────────────────────────────

export const config = {
  env: APP_ENV,

  // ── Web application URLs ──────────────────────────────────────────────────
  baseUrl:    process.env.BASE_URL    ?? 'https://marketplace.fptcloud.com/en',
  aiBaseUrl:  process.env.AI_BASE_URL ?? 'https://ai.fptcloud.com',

  // ── FPT user credentials ──────────────────────────────────────────────────
  fptUsername: process.env.FPT_USERNAME ?? '',
  fptPassword: process.env.FPT_PASSWORD ?? '',

  // ── FPT AI Marketplace API ────────────────────────────────────────────────
  fptApiKey:  process.env.FPT_API_KEY  ?? '',
  fptApiUrl:  process.env.FPT_API_URL  ?? 'https://mkp-api.fptcloud.com',
  fptFrom:    process.env.FPT_FROM     ?? '',

  // ── FPT Japan API ─────────────────────────────────────────────────────────
  fptJpApiKey: process.env.FPT_JP_API_KEY ?? '',
  fptJpApiUrl: process.env.FPT_JP_API_URL ?? 'https://mkp-api.fptcloud.jp',

  // ── Anthropic / Claude ────────────────────────────────────────────────────
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',

  // ── Jira ──────────────────────────────────────────────────────────────────
  jiraBaseUrl:    process.env.JIRA_BASE_URL    ?? '',
  jiraUsername:   process.env.JIRA_USERNAME    ?? '',
  jiraApiToken:   process.env.JIRA_API_TOKEN   ?? '',
  jiraSession:    process.env.JIRA_SESSION     ?? '',
  jiraProjectKey: process.env.JIRA_PROJECT_KEY ?? '',
  jiraBoardId:    process.env.JIRA_BOARD_ID    ?? '',
  jiraIssueKey:   process.env.JIRA_ISSUE_KEY   ?? '',

  // ── Playwright auth storage — one file per environment ───────────────────
  authFile:   `playwright/.auth/${APP_ENV}-user.json`,
  aiAuthFile: `playwright/.auth/${APP_ENV}-ai-user.json`,
} as const;
