"$content = @'
// sla-app-switcher.spec.ts - US-02: SLA Dashboard App Switcher
// Wiki: https://wiki.fci.vn/display/NCPP/SLA+Dashboard#app-switcher
// Grafana: https://ncp-grafana.fci.vn/d/658293bb-ec77-4d93-a4e9-6c7b4d13a844/sla-dashboard-stg
import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.BASE_URL ?? 'https://marketplace-stg.fptcloud.net/en';
const GRAFANA_DASHBOARD_URL = 'https://ncp-grafana.fci.vn/d/658293bb-ec77-4d93-a4e9-6c7b4d13a844/sla-dashboard-stg';

async function goto(page: any, url: string) {
  await page.goto(url, { waitUntil: 'commit', timeout: 60000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  await page.waitForTimeout(1500);
}

// TC-SLA-APP-006 - Truy cap truc tiep Grafana URL
test.describe('TC-SLA-APP-006 - Truy cap truc tiep Grafana URL', () => {
  test('TC-SLA-APP-006: Truy cap truc tiep URL Grafana Dashboard STG', async ({ page }) => {
    test.setTimeout(60000);

    const userId = process.env.USER_ID ?? 'c5032368-0211-4597-ab80-7ca4b1a0fde9';
    const grafanaUrl = `${GRAFANA_DASHBOARD_URL}?orgId=2&from=now-5m&to=now&timezone=browser&var-user_id=${userId}`;
    
    await goto(page, grafanaUrl);

    // Check URL: can be dashboard or login page (Grafana has separate auth)
    const url = page.url();
    const isDashboard = url.includes('sla-dashboard-stg');
    const isLoginPage = url.includes('login') || url.includes('microsoftonline');
    
    expect(isDashboard || isLoginPage).toBe(true);
    console.log(`Step 1 PASS: URL = ${url} (${isDashboard ? 'Dashboard' : 'Login Page'})`);

    // If dashboard is accessible, check title and panels
    if (isDashboard) {
      const dashboardTitle = page.getByText(/sla dashboard stg/i).or(page.locator('h1, h2, [class*=\"dashboard-title\"]'));
      await expect(dashboardTitle.first()).toBeVisible({ timeout: 15000 });
      console.log('Step 2 PASS: Dashboard title visible');

      const panels = page.locator('[class*=\"panel\"], [class*=\"chart\"], canvas, svg');
      const panelCount = await panels.count();
      expect(panelCount).toBeGreaterThan(0);
      console.log(`Step 3 PASS: Dashboard has ${panelCount} panels/charts`);
    } else {
      console.log('Step 2-3 SKIP: Redirected to login page (Grafana requires separate auth)');
    }
  });
});
'@

[System.IO.File]::WriteAllText('src/tests/e2e/sla-app-switcher.spec.ts', $content)
Write-Host 'File restored successfully'
"