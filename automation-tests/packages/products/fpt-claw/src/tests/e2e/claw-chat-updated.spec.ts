import { test, expect } from '@playwright/test';
import { ClawLoginPage } from '../../pages/ClawLoginPage';
import { ClawChatPage } from '../../pages/ClawChatPage';

test.describe('TC-CHAT — CLAW Chat Functionality (Updated)', () => {
  let loginPage: ClawLoginPage;
  let chatPage: ClawChatPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new ClawLoginPage(page);
    chatPage = new ClawChatPage(page);
  });

  test.describe('TC-CHAT-001: Login và Dashboard', () => {
    
    test('User can login successfully and view dashboard', async ({ page }) => {
      // STEP 1: Login
      await loginPage.login('root', 'd96a449c7d2b28dd0f4c745be31d2940');
      
      // STEP 2: Verify redirect to dashboard
      await expect(page).toHaveURL(/\/overview/i);
      console.log('✅ Step 1 PASS: Redirect đến overview thành công');

      // STEP 3: Verify dashboard greeting
      const greeting = page.getByRole('heading', { name: /Chào buổi (sáng|chiều|tối), Master!/i });
      await expect(greeting).toBeVisible({ timeout: 10000 });
      console.log('✅ Step 2 PASS: Dashboard greeting hiển thị');

      // STEP 4: Verify user logged in
      const userProfile = page.getByRole('button', { name: 'root', exact: true });
      await expect(userProfile).toBeVisible({ timeout: 5000 });
      console.log('✅ Step 3 PASS: User đã đăng nhập thành công');
    });
  });

  test.describe('TC-CHAT-002: Dashboard Overview Features', () => {
    
    test('User can view dashboard statistics and recent tasks', async ({ page }) => {
      await loginPage.login('root', 'd96a449c7d2b28dd0f4c745be31d2940');
      
      // Verify Briefing section
      const briefingHeading = page.getByRole('heading', { name: 'Briefing hôm nay' });
      await expect(briefingHeading).toBeVisible({ timeout: 10000 });
      console.log('✅ Briefing section hiển thị');

      // Verify stats cards
      const tasksToday = page.getByText('Tasks hôm nay');
      const agentsActive = page.getByText('Agents hoạt động');
      await expect(tasksToday).toBeVisible();
      await expect(agentsActive).toBeVisible();
      console.log('✅ Statistics cards hiển thị');

      // Verify recent tasks section
      const recentTasks = page.getByRole('heading', { name: 'Tasks gần đây' });
      await expect(recentTasks).toBeVisible();
      console.log('✅ Recent tasks section hiển thị');
    });
  });

  test.describe('TC-CHAT-003: Navigate to Chat Interface', () => {
    
    test('User can navigate to chat interface from sidebar', async ({ page }) => {
      await loginPage.login('root', 'd96a449c7d2b28dd0f4c745be31d2940');
      
      // Click "Tác vụ mới" menu
      await expect(chatPage.newTaskMenuItem()).toBeVisible({ timeout: 10000 });
      await chatPage.navigateToChat();
      console.log('✅ Navigate đến chat interface thành công');

      // Verify chat interface loaded
      await expect(page).toHaveURL(/\/chat/, { timeout: 5000 });
      
      // Verify chat heading
      const chatHeading = page.getByRole('heading', { name: 'Bạn muốn làm gì hôm nay?' });
      await expect(chatHeading).toBeVisible({ timeout: 5000 });
      console.log('✅ Chat interface hiển thị thành công');

      // Verify message input and send button
      await expect(chatPage.messageInput()).toBeVisible({ timeout: 5000 });
      await expect(chatPage.sendButton()).toBeVisible({ timeout: 5000 });
      console.log('✅ Message input và send button hiển thị');
    });
  });

  test.describe('TC-CHAT-004: Quick Actions and Templates', () => {
    
    test('User can see quick action buttons on chat page', async ({ page }) => {
      await loginPage.login('root', 'd96a449c7d2b28dd0f4c745be31d2940');
      await chatPage.navigateToChat();

      // Verify quick action buttons
      const quickActions = [
        'Phân tích thị trường',
        'Tạo báo cáo',
        'Gửi email campaign',
        'Nghiên cứu đối thủ',
        'Tạo agent mới',
        'Training agent',
        'Schedule cron job',
        'Debug agent lỗi'
      ];

      for (const action of quickActions) {
        const actionButton = page.getByRole('button', { name: action });
        await expect(actionButton).toBeVisible({ timeout: 3000 });
        console.log(`✅ Quick action "${action}" hiển thị`);
      }
    });
  });

  test.describe('TC-CHAT-005: Agent Selection', () => {
    
    test('User can select different AI agents', async ({ page }) => {
      await loginPage.login('root', 'd96a449c7d2b28dd0f4c745be31d2940');
      await chatPage.navigateToChat();

      // Verify agent selectors visible
      const clawgiAgent = chatPage.agentSelector('🐕 Clawgi');
      const glmAgent = chatPage.agentSelector('GLM-4.7');

      await expect(clawgiAgent).toBeVisible({ timeout: 5000 });
      await expect(glmAgent).toBeVisible({ timeout: 5000 });
      console.log('✅ Agent selectors visible');

      // Click on different agent
      await glmAgent.click();
      console.log('✅ Selected GLM-4.7 agent');
    });
  });

  test.describe('TC-CHAT-006: Basic Chat Flow', () => {
    test.setTimeout(180000); // 3 minutes

    test('User can send chat message and receive AI response', async ({ page }) => {
      await loginPage.login('root', 'd96a449c7d2b28dd0f4c745be31d2940');
      await chatPage.navigateToChat();

      // Verify chat interface loaded
      await expect(chatPage.messageInput()).toBeVisible({ timeout: 10000 });
      console.log('✅ Chat interface loaded');

      // Send first message
      const testMessage = 'Xin chào, hãy giới thiệu bản thân';
      await chatPage.sendMessage(testMessage);
      console.log('✅ Message sent successfully');

      // Verify user message appears
      await expect(chatPage.userMessage(testMessage)).toBeVisible({ timeout: 5000 });
      console.log('✅ User message hiển thị');

      // Verify AI response
      await chatPage.waitForAiResponse(90000);
      const responseText = await chatPage.aiResponseContent().textContent();
      expect(responseText?.length).toBeGreaterThan(10);
      console.log('✅ AI response received');
    });
  });

  test.describe('TC-CHAT-007: Multi-turn Conversation', () => {
    test.setTimeout(300000); // 5 minutes

    test('User can have multiple conversation turns', async ({ page }) => {
      await loginPage.login('root', 'd96a449c7d2b28dd0f4c745be31d2940');
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

  test.describe('TC-CHAT-008: File Upload Feature', () => {
    
    test('User can see file upload button', async ({ page }) => {
      await loginPage.login('root', 'd96a449c7d2b28dd0f4c745be31d2940');
      await chatPage.navigateToChat();

      // Verify file upload button
      const uploadButton = page.getByRole('button', { name: 'Tải tệp' });
      await expect(uploadButton).toBeVisible({ timeout: 5000 });
      console.log('✅ File upload button hiển thị');
    });
  });

  test.describe('TC-CHAT-009: Voice Recording Feature', () => {
    
    test('User can see voice recording button', async ({ page }) => {
      await loginPage.login('root', 'd96a449c7d2b28dd0f4c745be31d2940');
      await chatPage.navigateToChat();

      // Verify voice recording button
      const voiceButton = page.getByRole('button', { name: 'Ghi âm' });
      await expect(voiceButton).toBeVisible({ timeout: 5000 });
      console.log('✅ Voice recording button hiển thị');
    });
  });

  test.describe('TC-CHAT-010: Thinking Mode Toggle', () => {
    
    test('User can see thinking mode toggle', async ({ page }) => {
      await loginPage.login('root', 'd96a449c7d2b28dd0f4c745be31d2940');
      await chatPage.navigateToChat();

      // Verify thinking mode toggle
      const thinkingToggle = page.getByRole('button', { name: /Thinking: (ON|OFF)/i });
      await expect(thinkingToggle).toBeVisible({ timeout: 5000 });
      console.log('✅ Thinking mode toggle hiển thị');
    });
  });

  test.describe('TC-NAV-001: Navigation - Agent & Skill', () => {
    
    test('User can navigate to Agent & Skill page', async ({ page }) => {
      await loginPage.login('root', 'd96a449c7d2b28dd0f4c745be31d2940');
      
      // Navigate to Agent & Skill
      await page.getByRole('link', { name: 'Agent & Skill' }).click();
      await expect(page).toHaveURL(/\/agents/, { timeout: 5000 });
      console.log('✅ Navigate to Agent & Skill thành công');

      // Verify page content
      const launchedAgents = page.getByRole('heading', { name: 'Launched Agents' });
      await expect(launchedAgents).toBeVisible({ timeout: 5000 });
      console.log('✅ Launched Agents section hiển thị');
    });
  });

  test.describe('TC-NAV-002: Navigation - Agent Teams', () => {
    
    test('User can navigate to Agent Teams page', async ({ page }) => {
      await loginPage.login('root', 'd96a449c7d2b28dd0f4c745be31d2940');
      
      // Navigate to Agent Teams
      await page.getByRole('link', { name: 'Agent Teams' }).click();
      await expect(page).toHaveURL(/\/teams/, { timeout: 5000 });
      console.log('✅ Navigate to Agent Teams thành công');

      // Verify page content
      const teamHeading = page.getByRole('heading', { name: 'Agent Team' });
      await expect(teamHeading).toBeVisible({ timeout: 5000 });
      console.log('✅ Agent Team section hiển thị');
    });
  });

  test.describe('TC-NAV-003: Navigation - Explorer/Storage', () => {
    
    test('User can navigate to Explorer/Storage page', async ({ page }) => {
      await loginPage.login('root', 'd96a449c7d2b28dd0f4c745be31d2940');
      
      // Navigate to Explorer
      await page.getByRole('link', { name: 'Khám phá (Explorer)' }).click();
      await expect(page).toHaveURL(/\/storage/, { timeout: 5000 });
      console.log('✅ Navigate to Explorer thành công');

      // Verify page content
      const storageHeading = page.getByRole('heading', { name: 'Lưu trữ' });
      await expect(storageHeading).toBeVisible({ timeout: 5000 });
      console.log('✅ Storage section hiển thị');
    });
  });

  test.describe('TC-NAV-004: Navigation - Integrations', () => {
    
    test('User can navigate to Integrations page', async ({ page }) => {
      await loginPage.login('root', 'd96a449c7d2b28dd0f4c745be31d2940');
      
      // Navigate to Integrations
      await page.getByRole('link', { name: 'Tích hợp tài khoản' }).click();
      await expect(page).toHaveURL(/\/integrations/, { timeout: 5000 });
      console.log('✅ Navigate to Integrations thành công');

      // Verify page content
      const integrationsHeading = page.getByRole('heading', { name: 'Integrations' });
      await expect(integrationsHeading).toBeVisible({ timeout: 5000 });
      console.log('✅ Integrations section hiển thị');
    });
  });

  test.describe('TC-NAV-005: Navigation - Connectors', () => {
    
    test('User can navigate to Connectors page', async ({ page }) => {
      await loginPage.login('root', 'd96a449c7d2b28dd0f4c745be31d2940');
      
      // Navigate to Connectors
      await page.getByRole('link', { name: 'Tích hợp', exact: true }).click();
      await expect(page).toHaveURL(/\/connectors/, { timeout: 5000 });
      console.log('✅ Navigate to Connectors thành công');

      // Verify page content
      const connectorHeading = page.getByRole('heading', { name: 'Integration Settings' });
      await expect(connectorHeading).toBeVisible({ timeout: 5000 });
      console.log('✅ Integration Settings section hiển thị');
    });
  });

  test.describe('TC-NAV-006: Navigation - Workspace Config', () => {
    
    test('User can navigate to Workspace Config page', async ({ page }) => {
      await loginPage.login('root', 'd96a449c7d2b28dd0f4c745be31d2940');
      
      // Navigate to Workspace Config
      await page.getByRole('link', { name: 'Cài đặt Workspace' }).click();
      await expect(page).toHaveURL(/\/config/, { timeout: 5000 });
      console.log('✅ Navigate to Workspace Config thành công');

      // Verify page content
      const configHeading = page.getByRole('heading', { name: 'Cấu hình' });
      await expect(configHeading).toBeVisible({ timeout: 5000 });
      console.log('✅ Configuration section hiển thị');
    });
  });

  test.describe('TC-DASH-001: Dashboard - Quick Ask Feature', () => {
    
    test('User can see Quick Ask button on dashboard', async ({ page }) => {
      await loginPage.login('root', 'd96a449c7d2b28dd0f4c745be31d2940');
      
      // Verify Quick Ask button
      const quickAskButton = page.getByRole('button', { name: /Quick Ask/i });
      await expect(quickAskButton).toBeVisible({ timeout: 5000 });
      console.log('✅ Quick Ask button hiển thị trên dashboard');
    });
  });

  test.describe('TC-DASH-002: Dashboard - Language Selector', () => {
    
    test('User can see language selector', async ({ page }) => {
      await loginPage.login('root', 'd96a449c7d2b28dd0f4c745be31d2940');
      
      // Verify language selector
      const languageSelector = page.getByRole('button', { name: /Ngôn ngữ:/i });
      await expect(languageSelector).toBeVisible({ timeout: 5000 });
      console.log('✅ Language selector hiển thị');
    });
  });

  test.describe('TC-DASH-003: Dashboard - Recent Tasks Sidebar', () => {
    
    test('User can see recent tasks in sidebar', async ({ page }) => {
      await loginPage.login('root', 'd96a449c7d2b28dd0f4c745be31d2940');
      
      // Verify recent tasks section in sidebar
      const recentTasksLabel = page.getByText('Tác vụ gần đây');
      await expect(recentTasksLabel).toBeVisible({ timeout: 5000 });
      console.log('✅ Recent tasks sidebar hiển thị');
    });
  });

  test.describe('TC-CHAT-011: Chat Input Placeholder', () => {
    
    test('User can see correct placeholder in chat input', async ({ page }) => {
      await loginPage.login('root', 'd96a449c7d2b28dd0f4c745be31d2940');
      await chatPage.navigateToChat();

      // Verify input placeholder
      const input = chatPage.messageInput();
      await expect(input).toHaveAttribute('placeholder', /Gõ \/ để chọn action, @ để tag agent/i);
      console.log('✅ Chat input placeholder hiển thị đúng');
    });
  });
});








