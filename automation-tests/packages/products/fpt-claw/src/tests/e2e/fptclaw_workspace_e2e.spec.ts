import { test, expect } from "@playwright/test";


import { ClawLoginPage } from "../../pages/ClawLoginPage";




















test.describe("FPT CLAW Workspace E2E Test Suite", () => {
  let loginPage: ClawLoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new ClawLoginPage(page);
    await loginPage.login("root", "d96a449c7d2b28dd0f4c745be31d2940");
  });

  test.describe("TC-WORKSPACE-001: Agent and Skill Management", () => {
    test("User can navigate to Agent and Skill page", async ({ page }) => {
      await page.getByRole("link", { name: "Agent & Skill" }).click();
      console.log("Step 1 PASS: Navigated to Agent and Skill page");
      await expect(page).toHaveURL(/agents/, { timeout: 5000 });
      await expect(page.getByRole("heading", { name: "Launched Agents" })).toBeVisible({ timeout: 10000 });
      console.log("Step 2 PASS: Agent and Skill page loaded");
      await expect(page.getByRole("button", { name: "My Agents" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Templates" })).toBeVisible();
      await expect(page.getByRole("button", { name: "My Skills" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Marketplace", exact: true })).toBeVisible();
      console.log("Step 3 PASS: All tabs visible");
    });
  });

  test.describe("TC-WORKSPACE-002: Agent Teams Management", () => {
    test("User can navigate to Agent Teams page", async ({ page }) => {
      await page.getByRole("link", { name: "Agent Teams" }).click();
      console.log("Step 1 PASS: Navigated to Agent Teams page");
      await expect(page).toHaveURL(/teams/, { timeout: 5000 });
      await expect(page.getByRole("heading", { name: "Agent Team" })).toBeVisible({ timeout: 10000 });
      console.log("Step 2 PASS: Agent Teams page loaded");
    });
  });

  test.describe("TC-WORKSPACE-003: Explorer (Storage) Functionality", () => {
    test("User can navigate to Explorer page", async ({ page }) => {
      await page.getByRole("link", { name: "Khám phá (Explorer)" }).click();
      console.log("Step 1 PASS: Navigated to Explorer page");
      await expect(page).toHaveURL(/storage/, { timeout: 5000 });
      await expect(page.getByRole("heading", { name: "Lưu trữ" })).toBeVisible({ timeout: 10000 });
      console.log("Step 2 PASS: Explorer page loaded");
    });
  });

  test.describe("TC-WORKSPACE-004: Account Integrations", () => {
    test("User can navigate to Integrations page", async ({ page }) => {
      await page.getByRole("link", { name: "Tích hợp tài khoản" }).click();
      console.log("Step 1 PASS: Navigated to Integrations page");
      await expect(page).toHaveURL(/integrations/, { timeout: 5000 });
      await expect(page.getByRole("heading", { name: "Integrations" })).toBeVisible({ timeout: 10000 });
      console.log("Step 2 PASS: Integrations page loaded");
    });
  });
});
