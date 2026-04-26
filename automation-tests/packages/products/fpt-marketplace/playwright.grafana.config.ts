import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  use: {
    baseURL: 'https://ncp-grafana.fci.vn',
    storageState: './src/playwright/.auth/test-grafana-user.json',
  },
  projects: [
    {
      name: 'grafana-test',
      testMatch: '**/tests/e2e/test-grafana.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});