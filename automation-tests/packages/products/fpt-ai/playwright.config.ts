import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

const APP_ENV = (process.env.APP_ENV ?? 'test') as 'test' | 'stg' | 'prod';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, `../../../.env.${APP_ENV}`), override: true });

const authFile = `playwright/.auth/${APP_ENV}-ai-user.json`;
const AI_BASE_URL = process.env.AI_BASE_URL ?? 'https://ai.fptcloud.com';

export default defineConfig({
  testDir: './src',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['html', { outputFolder: `reports/playwright-report` }],
    ['json', { outputFile: `reports/test-results.json` }],
    ['list'],
  ],

  use: {
    baseURL: AI_BASE_URL,
    trace: 'on-first-retry',
    ignoreHTTPSErrors: APP_ENV !== 'prod',
    proxy: process.env.HTTPS_PROXY
      ? { server: process.env.HTTPS_PROXY }
      : undefined,
  },

  projects: [
    {
      name: 'ai-setup',
      testMatch: '**/fixtures/ai-auth.setup.ts',
    },
    {
      name: 'smoke',
      testMatch: '**/tests/smoke/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], storageState: authFile },
      dependencies: ['ai-setup'],
    },
    {
      name: 'regression',
      testMatch: '**/tests/regression/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], storageState: authFile },
      dependencies: ['ai-setup'],
    },
  ],
});
