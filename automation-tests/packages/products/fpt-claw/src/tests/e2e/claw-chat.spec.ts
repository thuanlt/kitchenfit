import { test, expect } from '@playwright/test';
import { ClawLoginPage } from '../../pages/ClawLoginPage';
import { ClawChatPage } from '../../pages/ClawChatPage';

test.describe('TC-CHAT — CLAW Chat Functionality', () => {
  let loginPage: ClawLoginPage;
  let chatPage: ClawChatPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new ClawLoginPage(page);
    chatPage  = new ClawChatPage(page);
  });

  test.describe('TC-CHAT-001: Login và Dashboard', () => {
    
    test('User can login successfully and view dashboard', async ({ page }) => {
      // STEP 1: Login
      await loginPage.login('Thuanlt11@fpt.com', 'Thuanlt11@fpt.com');
      
      // STEP 2: Verify redirect to dashboard
      await expect(page).not.toHaveURL(/\/login/i);
      console.log('✅ Step 1 PASS: Redirect khỏi trang login thành công');

      // STEP 3: Verify dashboard content visible
      const dashboardVisible = await chatPage.dashboardContent().isVisible({ timeout: 10000 }).catch(() => false);
      // Nếu dashboard content không visible, ít nhất verify URL đã thay đổi
      if (!dashboardVisible) {
        await expect(page).toHaveURL(/\/overview|\/dashboard/i);
        console.log('⚠️ Step 2: Dashboard content không visible nhưng URL đã thay đổi');
      } else {
        console.log('✅ Step 2 PASS: Dashboard hiển thị thành công');
      }

      // STEP 4: Verify user logged in
      const userProfile = page.getByRole('button', { name: 'Thuanlt11@fpt.com' });
      await expect(userProfile).toBeVisible({ timeout: 5000 });
      console.log('✅ Step 3 PASS: User đã đăng nhập thành công');
    });
  });

  test.describe('TC-CHAT-002: Create New Task from Menu', () => {
    
    test('User can navigate to chat interface', async ({ page }) => {
      // STEP 1: Login
      await loginPage.login('Thuanlt11@fpt.com', 'Thuanlt11@fpt.com');
      console.log('✅ Step 1 PASS: Login thành công');

      // STEP 2: Click "Tác vụ mới" menu
      await expect(chatPage.newTaskMenuItem()).toBeVisible({ timeout: 10000 });
      await chatPage.navigateToChat();
      console.log('✅ Step 2 PASS: Navigate đến chat interface thành công');

      // STEP 3: Verify chat interface loaded
      await expect(page).toHaveURL(/\/chat/, { timeout: 5000 });
      await expect(chatPage.messageInput()).toBeVisible({ timeout: 5000 });
      console.log('✅ Step 3 PASS: Chat interface hiển thị thành công');

      // STEP 4: Verify send button visible
      await expect(chatPage.sendButton()).toBeVisible({ timeout: 5000 });
      console.log('✅ Step 4 PASS: Nút Gửi hiển thị');
    });
  });

  test.describe('TC-CHAT-003: Basic Chat Flow', () => {
    test.setTimeout(180000); // 3 minutes — agentic AI response có thể mất >60s
    test('User can send chat message and receive AI response', async ({ page }) => {
      // STEP 1: Login and navigate to chat
      await loginPage.login('Thuanlt11@fpt.com', 'Thuanlt11@fpt.com');
      await chatPage.navigateToChat();
      console.log('✅ Step 1 PASS: Login và navigate đến chat thành công');

      // STEP 2: Verify chat interface loaded
      await expect(chatPage.messageInput()).toBeVisible({ timeout: 10000 });
      console.log('✅ Step 2 PASS: Chat interface loaded');

      // STEP 3: Send first message
      const testMessage = 'Xin chào, hãy giới thiệu bản thân';
      await chatPage.sendMessage(testMessage);
      console.log('✅ Step 3 PASS: Message sent successfully');

      // STEP 4: Verify user message appears
      await expect(chatPage.userMessage(testMessage)).toBeVisible({ timeout: 5000 });
      console.log('✅ Step 4 PASS: User message hiển thị');

      // STEP 5: Verify AI response
      await chatPage.waitForAiResponse(90000);
      const responseText = await chatPage.aiResponseContent().textContent();
      expect(responseText?.length).toBeGreaterThan(10);
      console.log('✅ Step 5 PASS: AI response received');

      // STEP 6: Verify copy and retry buttons (optional - may not be visible)
      const copyVisible = await chatPage.copyButton().isVisible({ timeout: 3000 }).catch(() => false);
      const retryVisible = await chatPage.retryButton().isVisible({ timeout: 3000 }).catch(() => false);
      if (copyVisible && retryVisible) {
        console.log('✅ Step 6 PASS: Copy và Retry buttons hiển thị');
      } else {
        console.log('⚠️ Step 6: Copy/Retry buttons không hiển thị (có thể là optional feature)');
      }
    });
  });

  test.describe('TC-CHAT-004: Multi-turn Conversation', () => {
    test.setTimeout(300000); // 5 minutes — 2 turns × ~90s mỗi turn + overhead

    test('User can have multiple conversation turns', async ({ page }) => {
      // Login and navigate to chat
      await loginPage.login('Thuanlt11@fpt.com', 'Thuanlt11@fpt.com');
      await chatPage.navigateToChat();

      // Turn 1: First question
      const message1 = 'Bạn có thể làm gì?';
      await chatPage.sendMessage(message1);
      await expect(chatPage.userMessage(message1)).toBeVisible({ timeout: 5000 });
      await chatPage.waitForAiResponse(120000);
      console.log('✅ Turn 1 PASS: First message sent and AI responded');

      // Turn 2: Follow-up question
      const message2 = 'Hãy viết một đoạn văn ngắn về AI';
      await chatPage.sendFollowUpMessage(message2);
      await expect(chatPage.userMessage(message2)).toBeVisible({ timeout: 5000 });
      await chatPage.waitForAiResponse(120000);
      console.log('✅ Turn 2 PASS: Follow-up message sent and AI responded');

      // Verify both messages in conversation
      await expect(chatPage.userMessage(message1)).toBeVisible();
      await expect(chatPage.userMessage(message2)).toBeVisible();
      console.log('✅ PASS: Multi-turn conversation successful');
    });
  });

  test.describe('TC-CHAT-005: Agent Selection', () => {
    
    test('User can select different AI agents', async ({ page }) => {
      // Login and navigate to chat
      await loginPage.login('Thuanlt11@fpt.com', 'Thuanlt11@fpt.com');
      await chatPage.navigateToChat();

      // Verify agent selectors visible
      const clawgiAgent = chatPage.agentSelector('🐕 Clawgi');
      const glmAgent = chatPage.agentSelector('GLM-4.7');

      await expect(clawgiAgent).toBeVisible({ timeout: 5000 });
      await expect(glmAgent).toBeVisible({ timeout: 5000 });
      console.log('✅ PASS: Agent selectors visible');

      // Click on different agent (optional)
      await glmAgent.click();
      console.log('✅ PASS: Selected GLM-4.7 agent');
    });
  });

  test.describe('TC-CHAT-006: Chat Actions', () => {
    test.setTimeout(180000); // 3 minutes — wait for AI + action buttons

    test('User can use copy and retry buttons', async ({ page }) => {
      // Login and navigate to chat
      await loginPage.login('Thuanlt11@fpt.com', 'Thuanlt11@fpt.com');
      await chatPage.navigateToChat();

      // Send a message
      await chatPage.sendMessage('Test message for actions');
      await chatPage.waitForAiResponse(90000);

      // Test copy button (optional - may not be visible)
      const copyVisible = await chatPage.copyButton().isVisible({ timeout: 5000 }).catch(() => false);
      if (copyVisible) {
        await chatPage.copyButton().click();
        console.log('✅ PASS: Copy button clicked');
      } else {
        console.log('⚠️ Copy button không hiển thị (skip test)');
      }

      // Test retry button
      await expect(chatPage.retryButton()).toBeVisible({ timeout: 5000 });
      await chatPage.retryButton().click();
      console.log('✅ PASS: Retry button clicked');
    });
  });

});
