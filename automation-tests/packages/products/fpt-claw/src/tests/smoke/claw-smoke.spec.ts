import { test, expect } from '@playwright/test';
import { ClawLoginPage } from '../../pages/ClawLoginPage';
import { ClawChatPage } from '../../pages/ClawChatPage';

/**
 * Smoke Tests - FPT CLAW
 * 
 * Mục tiêu: Test nhanh xác nhận app up và các tính năng cơ bản hoạt động
 * Thời gian chạy: < 1 phút
 * Chạy sau mỗi deploy để verify app hoạt động bình thường
 */
test.describe('SMOKE — FPT CLAW Health Check', () => {
  let loginPage: ClawLoginPage;
  let chatPage: ClawChatPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new ClawLoginPage(page);
    chatPage = new ClawChatPage(page);
  });

  test.describe('SMOKE-001: App Accessibility', () => {
    
    test('App is accessible and login page loads', async ({ page }) => {
      // Navigate to login page
      await page.goto('https://dev-claw.fptcloud.net/login');
      
      // Verify page title
      await expect(page).toHaveTitle(/FPTClaw Dashboard/i);
      
      // Verify login form elements visible
      await expect(loginPage.emailInput()).toBeVisible({ timeout: 10000 });
      await expect(loginPage.passwordInput()).toBeVisible({ timeout: 5000 });
      await expect(loginPage.signInButton()).toBeVisible({ timeout: 5000 });
      
      console.log('✅ SMOKE-001 PASS: App accessible, login page loads');
    });
  });

  test.describe('SMOKE-002: Authentication', () => {
    
    test('User can login successfully', async ({ page }) => {
      // Login with test account
      await loginPage.login('Thuanlt11@fpt.com', 'Thuanlt11@fpt.com');
      
      // Verify redirect away from login page
      await expect(page).not.toHaveURL(/\/login/i);
      
      // Verify URL changed to dashboard/overview
      await expect(page).toHaveURL(/\/overview|\/dashboard|\/home/i);
      
      console.log('✅ SMOKE-002 PASS: Login successful, redirected to dashboard');
    });
  });

  test.describe('SMOKE-003: Dashboard Load', () => {
    
    test('Dashboard loads and displays content', async ({ page }) => {
      // Login
      await loginPage.login('Thuanlt11@fpt.com', 'Thuanlt11@fpt.com');
      
      // Verify dashboard content visible
      await expect(chatPage.dashboardContent()).toBeVisible({ timeout: 10000 });
      
      // Verify user profile visible
      const userProfile = page.getByRole('button', { name: 'Thuanlt11@fpt.com' });
      await expect(userProfile).toBeVisible({ timeout: 5000 });
      
      // Verify menu items visible
      await expect(chatPage.newTaskMenuItem()).toBeVisible({ timeout: 5000 });
      
      console.log('✅ SMOKE-003 PASS: Dashboard loads and displays content');
    });
  });

  test.describe('SMOKE-004: Chat Interface Access', () => {
    
    test('Chat interface is accessible', async ({ page }) => {
      // Login
      await loginPage.login('Thuanlt11@fpt.com', 'Thuanlt11@fpt.com');
      
      // Navigate to chat
      await chatPage.navigateToChat();
      
      // Verify chat interface loaded
      await expect(page).toHaveURL(/\/chat/, { timeout: 5000 });
      
      // Verify chat input visible
      await expect(chatPage.messageInput()).toBeVisible({ timeout: 5000 });
      
      // Verify send button visible
      await expect(chatPage.sendButton()).toBeVisible({ timeout: 5000 });
      
      console.log('✅ SMOKE-004 PASS: Chat interface accessible');
    });
  });

  test.describe('SMOKE-005: Quick Message Test', () => {
    
    test('Can send a quick message and receive response', async ({ page }) => {
      test.setTimeout(45000); // 45s timeout for AI response
      
      // Login and navigate to chat
      await loginPage.login('Thuanlt11@fpt.com', 'Thuanlt11@fpt.com');
      await chatPage.navigateToChat();
      
      // Send a simple test message
      const testMessage = 'Hello';
      await chatPage.sendMessage(testMessage);
      
      // Verify message sent
      await expect(chatPage.userMessage(testMessage)).toBeVisible({ timeout: 5000 });
      
      // Verify AI responds (with reasonable timeout)
      await chatPage.waitForAiResponse(30000);
      
      // Verify response has content
      const responseText = await chatPage.aiResponseContent().textContent();
      expect(responseText?.length).toBeGreaterThan(5);
      
      console.log('✅ SMOKE-005 PASS: Quick message sent and AI responded');
    });
  });

  test.describe('SMOKE-006: Agent Selection', () => {
    
    test('Agent selectors are available', async ({ page }) => {
      // Login and navigate to chat
      await loginPage.login('Thuanlt11@fpt.com', 'Thuanlt11@fpt.com');
      await chatPage.navigateToChat();
      
      // Verify at least one agent selector visible
      const clawgiAgent = chatPage.agentSelector('🐕 Clawgi');
      await expect(clawgiAgent).toBeVisible({ timeout: 5000 });
      
      console.log('✅ SMOKE-006 PASS: Agent selectors available');
    });
  });

});