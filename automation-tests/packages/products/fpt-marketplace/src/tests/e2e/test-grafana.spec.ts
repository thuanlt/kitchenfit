import { test, expect } from "@playwright/test";
test("Test Grafana URL", async ({ page }) => {
  test.setTimeout(60000);
  const url = "https://ncp-grafana.fci.vn/d/658293bb-ec77-4d93-a4e9-6c7b4d13a844/sla-dashboard-stg?orgId=2&from=now-5m&to=now&timezone=browser&var-user_id=c5032368-0211-4597-ab80-7ca4b1a0fde9";
  await page.goto(url, { waitUntil: "commit", timeout: 60000 });
  await page.waitForLoadState("domcontentloaded", { timeout: 30000 });
  await page.waitForTimeout(1500);
  const finalUrl = page.url();
  const isDashboard = finalUrl.includes("sla-dashboard-stg");
  const isLoginPage = finalUrl.includes("login") || finalUrl.includes("microsoftonline");
  expect(isDashboard || isLoginPage).toBe(true);
  console.log("Final URL: " + finalUrl);
  console.log("Is Dashboard: " + isDashboard);
  console.log("Is Login Page: " + isLoginPage);
});
