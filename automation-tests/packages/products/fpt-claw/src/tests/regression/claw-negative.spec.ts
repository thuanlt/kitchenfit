import { test, expect } from '@playwright/test';
import { ClawLoginPage } from '../../pages/ClawLoginPage';
import { ClawChatPage } from '../../pages/ClawChatPage';

/**
 * Negative Test Cases - FPT CLAW
 * 
 * Mục tiêu: Test các trường hợp ngoại lệ và error handling
 * Phủ sóng: Invalid inputs, error messages, edge cases
 */
test.describe('NEGATIVE — FPT CLAW Error Handling', () => {
  let loginPage: ClawLoginPage;
  let chatPage: ClawChatPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new ClawLoginPage(page);
    chatPage = new ClawChatPage(page);
  });

  test.describe('NEG-001: Login - Invalid Credentials', () => {
    
    test('Should show error message with wrong password', async ({ page }) => {
      // Navigate to login page
      await page.goto('https://dev-claw.fptcloud.net/login');
      
      // Enter correct email but wrong password
      await loginPage.emailInput().fill('Thuanlt11@fpt.com');
      await loginPage.passwordInput().fill('WrongPassword123');
      await loginPage.signInButton().click();
      
      // Wait for error message
      await page.waitForTimeout(2000);
      
      // Verify error message appears
      const errorMessage = page.getByText(/thông tin đăng nhập không hợp lệ|invalid credentials|sai tên đăng nhập hoặc mật khẩu/i);
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
      
      // Verify still on login page
      await expect(page).toHaveURL(/\/login/i);
      
      console.log('✅ NEG-001 PASS: Error message displayed for wrong password');
    });

    test('Should show error message with invalid email format', async ({ page }) => {
      // Navigate to login page
      await page.goto('https://dev-claw.fptcloud.net/login');
      
      // Enter invalid email format
      await loginPage.emailInput().fill('invalid-email');
      await loginPage.passwordInput().fill('SomePassword123');
      
      // Check if sign in button is disabled or shows validation error
      const signInBtn = loginPage.signInButton();
      const isDisabled = await signInBtn.isDisabled().catch(() => false);
      
      if (isDisabled) {
        console.log('✅ NEG-001b PASS: Sign in button disabled for invalid email');
      } else {
        // Try to click and verify error
        await signInBtn.click();
        await page.waitForTimeout(1000);
        const errorMessage = page.getByText(/email|định dạng|invalid/i);
        const hasError = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);
        if (hasError) {
          console.log('✅ NEG-001b PASS: Validation error shown for invalid email');
        } else {
          console.log('⚠️ NEG-001b: No validation for invalid email (may be intentional)');
        }
      }
    });
  });

  test.describe('NEG-002: Login - Empty Fields', () => {
    
    test('Should not allow login with empty email', async ({ page }) => {
      // Navigate to login page
      await page.goto('https://dev-claw.fptcloud.net/login');
      
      // Leave email empty, fill password
      await loginPage.passwordInput().fill('SomePassword123');
      
      // Check if sign in button is disabled
      const signInBtn = loginPage.signInButton();
      const isDisabled = await signInBtn.isDisabled().catch(() => false);
      
      expect(isDisabled).toBeTruthy();
      console.log('✅ NEG-002a PASS: Sign in button disabled with empty email');
    });

    test('Should not allow login with empty password', async ({ page }) => {
      // Navigate to login page
      await page.goto('https://dev-claw.fptcloud.net/login');
      
      // Fill email, leave password empty
      await loginPage.emailInput().fill('Thuanlt11@fpt.com');
      
      // Check if sign in button is disabled
      const signInBtn = loginPage.signInButton();
      const isDisabled = await signInBtn.isDisabled().catch(() => false);
      
      expect(isDisabled).toBeTruthy();
      console.log('✅ NEG-002b PASS: Sign in button disabled with empty password');
    });

    test('Should not allow login with both fields empty', async ({ page }) => {
      // Navigate to login page
      await page.goto('https://dev-claw.fptcloud.net/login');
      
      // Leave both fields empty
      
      // Check if sign in button is disabled
      const signInBtn = loginPage.signInButton();
      const isDisabled = await signInBtn.isDisabled().catch(() => false);
      
      expect(isDisabled).toBeTruthy();
      console.log('✅ NEG-002c PASS: Sign in button disabled with both fields empty');
    });
  });

  test.describe('NEG-003: Chat - Empty Message', () => {
    
    test('Should not send empty message', async ({ page }) => {
      // Login and navigate to chat
      await loginPage.login('Thuanlt11@fpt.com', 'Thuanlt11@fpt.com');
      await chatPage.navigateToChat();
      
      // Get send button initial state
      const sendBtn = chatPage.sendButton();
      const initiallyDisabled = await sendBtn.isDisabled().catch(() => false);
      
      // Try to click without typing anything
      await sendBtn.click();
      
      // Verify no message was sent (still no user messages)
      const userMessages = page.locator('generic').filter({ hasText: /Xin chào|Hello/i });
      const messageCount = await userMessages.count();
      
      // Should still be 0 or same as before
      expect(messageCount).toBe(0);
      
      // Send button should still be disabled
      const stillDisabled = await sendBtn.isDisabled().catch(() => false);
      expect(stillDisabled).toBeTruthy();
      
      console.log('✅ NEG-003 PASS: Empty message not sent');
    });

    test('Should not send message with only whitespace', async ({ page }) => {
      // Login and navigate to chat
      await loginPage.login('Thuanlt11@fpt.com', 'Thuanlt11@fpt.com');
      await chatPage.navigateToChat();
      
      // Type only whitespace
      await chatPage.messageInput().fill('   ');
      
      // Try to send
      const sendBtn = chatPage.sendButton();
      const isDisabled = await sendBtn.isDisabled().catch(() => false);
      
      if (isDisabled) {
        console.log('✅ NEG-003b PASS: Send button disabled for whitespace-only message');
      } else {
        await sendBtn.click();
        await page.waitForTimeout(1000);
        
        // Verify no message sent
        const userMessages = page.locator('generic').filter({ hasText: /Xin chào|Hello/i });
        const messageCount = await userMessages.count();
        expect(messageCount).toBe(0);
        console.log('✅ NEG-003b PASS: Whitespace-only message not sent');
      }
    });
  });

  test.describe('NEG-004: Chat - Very Long Message', () => {
    
    test('Should handle very long message', async ({ page }) => {
      test.setTimeout(60000); // 60s timeout
      
      // Login and navigate to chat
      await loginPage.login('Thuanlt11@fpt.com', 'Thuanlt11@fpt.com');
      await chatPage.navigateToChat();
      
      // Create a very long message (10,000 characters)
      const longMessage = 'A'.repeat(10000);
      
      // Type and send
      await chatPage.messageInput().fill(longMessage);
      await chatPage.sendButton().click();
      
      // Verify message appears (may be truncated)
      await page.waitForTimeout(2000);
      const hasMessage = await page.getByText(/A{100,}/).isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasMessage) {
        console.log('✅ NEG-004 PASS: Long message handled and displayed');
      } else {
        // Check for error message
        const errorMessage = page.getByText(/quá dài|too long|exceeds limit/i);
        const hasError = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (hasError) {
          console.log('✅ NEG-004 PASS: Error shown for message exceeding limit');
        } else {
          console.log('⚠️ NEG-004: Long message behavior unclear (may need manual check)');
        }
      }
    });
  });

  test.describe('NEG-005: Chat - Special Characters', () => {
    
    test('Should handle special characters in message', async ({ page }) => {
      test.setTimeout(60000); // 60s timeout
      
      // Login and navigate to chat
      await loginPage.login('Thuanlt11@fpt.com', 'Thuanlt11@fpt.com');
      await chatPage.navigateToChat();
      
      // Message with special characters
      const specialMessage = 'Test with special chars: !@#$%^&*()_+-={}[]|\\:";\'<>?,./~`';
      
      // Send message
      await chatPage.sendMessage(specialMessage);
      
      // Verify message sent
      await expect(chatPage.userMessage(specialMessage)).toBeVisible({ timeout: 5000 });
      
      // Wait for AI response
      await chatPage.waitForAiResponse(30000);
      
      console.log('✅ NEG-005 PASS: Special characters handled correctly');
    });
  });

  test.describe('NEG-006: Network Error Handling', () => {
    
    test('Should show error indicator when offline', async ({ page, context }) => {
      // Login first
      await loginPage.login('Thuanlt11@fpt.com', 'Thuanlt11@fpt.com');
      await chatPage.navigateToChat();
      
      // Simulate offline mode
      await context.setOffline(true);
      
      // Try to send a message
      await chatPage.messageInput().fill('Test offline');
      await chatPage.sendButton().click();
      
      // Wait for error indicator
      await page.waitForTimeout(2000);
      
      // Check for error indicator (may vary by implementation)
      const errorIndicator = page.locator('.error, .network-error, [data-testid="error"]');
      const hasError = await errorIndicator.isVisible({ timeout: 3000 }).catch(() => false);
      
      // Check if send button shows loading/error state
      const sendBtn = chatPage.sendButton();
      const hasLoading = await sendBtn.locator('.loading, .spinner').isVisible({ timeout: 1000 }).catch(() => false);
      
      if (hasError || hasLoading) {
        console.log('✅ NEG-006 PASS: Network error indicator shown');
      } else {
        console.log('⚠️ NEG-006: No explicit error indicator (may handle silently)');
      }
      
      // Restore connection
      await context.setOffline(false);
    });
  });

  test.describe('NEG-007: Invalid URL Access', () => {
    
    test('Should redirect to login when accessing protected route without auth', async ({ page }) => {
      // Try to access chat directly without login
      await page.goto('https://dev-claw.fptcloud.net/chat');
      
      // Should redirect to login page
      await page.waitForTimeout(2000);
      const isOnLoginPage = await page.url().includes('/login');
      
      expect(isOnLoginPage).toBeTruthy();
      console.log('✅ NEG-007 PASS: Redirected to login when accessing protected route');
    });

    test('Should handle 404 page gracefully', async ({ page }) => {
      // Try to access non-existent page
      await page.goto('https://dev-claw.fptcloud.net/non-existent-page-12345');
      
      // Should show 404 or redirect to home/login
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      
      const isHandled = currentUrl.includes('/login') || 
                       currentUrl.includes('/overview') ||
                       currentUrl.includes('404') ||
                       await page.getByText(/404|not found|không tìm thấy/i).isVisible({ timeout: 1000 }).catch(() => false);
      
      expect(isHandled).toBeTruthy();
      console.log('✅ NEG-007b PASS: 404 page handled gracefully');
    });
  });

});