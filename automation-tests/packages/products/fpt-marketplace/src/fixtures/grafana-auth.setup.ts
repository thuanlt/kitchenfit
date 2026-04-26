import { test as setup, expect } from "@playwright/test";
import path from "path";
import readline from "readline";

const APP_ENV = process.env.APP_ENV ?? "test";
const authFile = path.join(__dirname, `../playwright/.auth/${APP_ENV}-grafana-user.json`);

function waitForEnter() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question("Press ENTER after you have logged in to Grafana...", () => {
      rl.close();
      resolve();
    });
  });
}

setup("authenticate grafana", async ({ page }) => {
  const GRAFANA_URL = "https://ncp-grafana.fci.vn/d/658293bb-ec77-4d93-a4e9-6c7b4d13a844/sla-dashboard-stg";
  
  console.log("Starting Grafana authentication...");
  
  await page.goto(GRAFANA_URL, { waitUntil: "commit", timeout: 60000 });
  await page.waitForLoadState("domcontentloaded", { timeout: 30000 });
  
  const url = page.url();
  const isDashboard = url.includes("sla-dashboard-stg") && !url.includes("login");
  const isLoginPage = url.includes("login") || url.includes("microsoftonline");
  
  if (isDashboard) {
    console.log("Already logged in to Grafana");
  } else if (isLoginPage) {
    console.log("Please login to Grafana in the browser window...");
    console.log("URL:", url);
    await waitForEnter();
  }
  
  await expect(page.locator("h1, h2, [class*=\"dashboard-title\"]").first()).toBeVisible({ timeout: 15000 });
  
  await page.context().storageState({ path: authFile });
  console.log(`Grafana auth setup [${APP_ENV}]: session saved to`, authFile);
});
