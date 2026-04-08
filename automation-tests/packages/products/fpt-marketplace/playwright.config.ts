import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

const APP_ENV = (process.env.APP_ENV ?? 'test') as 'test' | 'stg' | 'prod';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, `../../../.env.${APP_ENV}`), override: true });

const authFile = `playwright/.auth/${APP_ENV}-user.json`;

const BASE_URL = process.env.BASE_URL ?? 'https://marketplace.fptcloud.com/en';

export default defineConfig({
  testDir: './src',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { outputFolder: `reports/playwright-report` }],
    ['json', { outputFile: `reports/test-results.json` }],
    ['list'],
  ],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    ignoreHTTPSErrors: APP_ENV !== 'prod',
    proxy: process.env.HTTPS_PROXY
      ? { server: process.env.HTTPS_PROXY }
      : undefined,
  },

  projects: [
    {
      name: 'setup',
      testMatch: '**/fixtures/auth.setup.ts',
    },
    {
      name: 'smoke',
      testMatch: '**/tests/smoke/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], storageState: authFile },
      dependencies: ['setup'],
    },
    {
      name: 'regression',
      testMatch: '**/tests/regression/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], storageState: authFile },
      dependencies: ['setup'],
    },
    {
      name: 'api',
      testMatch: '**/tests/api/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
