import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// ── Environment setup ──────────────────────────────────────────────────────
// APP_ENV controls which environment to target: test | stg | prod
// Default: test
// Example: APP_ENV=stg npx playwright test
const APP_ENV = (process.env.APP_ENV ?? 'test') as 'test' | 'stg' | 'prod';

// 1. Load shared secrets / defaults (.env)
dotenv.config({ path: path.resolve(__dirname, '.env') });
// 2. Load environment-specific overrides (.env.test / .env.stg / .env.prod)
dotenv.config({ path: path.resolve(__dirname, `.env.${APP_ENV}`), override: true });

// Auth storage paths — isolated per environment to prevent session cross-contamination
const authFile   = `playwright/.auth/${APP_ENV}-user.json`;
const aiAuthFile = `playwright/.auth/${APP_ENV}-ai-user.json`;

const BASE_URL   = process.env.BASE_URL   ?? 'https://marketplace.fptcloud.com/en';
const AI_BASE_URL = process.env.AI_BASE_URL ?? 'https://ai.fptcloud.com';

console.log(`▶ Running against environment: ${APP_ENV.toUpperCase()} (${BASE_URL})`);

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: `reports/${APP_ENV}/playwright-report` }],
    ['json', { outputFile: `reports/${APP_ENV}/test-results.json` }],
  ],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    // STG/test dùng internal CA cert — bỏ qua SSL verify trên non-prod
    ignoreHTTPSErrors: APP_ENV !== 'prod',
    proxy: process.env.HTTPS_PROXY || process.env.HTTP_PROXY
      ? { server: (process.env.HTTPS_PROXY || process.env.HTTP_PROXY)! }
      : undefined,
  },

  projects: [
    // ── Auth setup cho marketplace.fptcloud.com ──────────────────
    {
      name: 'setup',
      testMatch: '**/fixtures/auth.setup.ts',
    },

    // ── Auth setup cho ai.fptcloud.com ───────────────────────────
    {
      name: 'ai-setup',
      testMatch: '**/fixtures/ai-auth.setup.ts',
    },

    // ── Smoke tests ──────────────────────────────────────────────
    {
      name: 'smoke',
      testMatch: '**/tests/smoke/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
    },

    // ── Regression tests (marketplace.fptcloud.com) ──────────────
    {
      name: 'regression',
      testMatch: '**/tests/regression/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
    },

    // ── API tests ────────────────────────────────────────────────
    {
      name: 'api',
      testMatch: '**/tests/api/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // ── AI Factory tests (ai.fptcloud.com) ──────────────────────
    {
      name: 'ai-chromium',
      testMatch: '**/tests/ai-fptcloud/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: AI_BASE_URL,
        storageState: aiAuthFile,
      },
      dependencies: ['ai-setup'],
    },
  ],
});
