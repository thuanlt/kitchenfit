import { Page, Locator } from '@playwright/test';

export class ClawChatPage {
  constructor(private readonly page: Page) {}

  // --- Dashboard ---

  /**
   * Bug 1 fix: dùng selector chính xác hơn cho dashboard content.
   * Tránh dùng text generic — tìm element đặc trưng của dashboard (sidebar nav hoặc heading).
   */
  dashboardContent(): Locator {
    return this.page.getByRole('button', { name: 'Thuanlt11@fpt.com' });
  }

  // --- Navigation ---

  newTaskMenuItem(): Locator {
    // DOM: link "Tác vụ mới" trong sidebar nav (không phải button)
    return this.page.getByRole('link', { name: /tác vụ mới|new task/i });
  }

  async navigateToChat(): Promise<void> {
    await this.newTaskMenuItem().click();
    await this.page.waitForURL(/\/chat/, { timeout: 10000 });
    // Nếu có task đang chạy (Dừng visible), click "Task mới" trong main để tạo fresh task
    const stopBtn = this.page.getByRole('button', { name: 'Dừng' });
    const newTaskInMain = this.page.getByRole('button', { name: 'Task mới' });
    const isRunning = await stopBtn.isVisible({ timeout: 1500 }).catch(() => false);
    if (isRunning && await newTaskInMain.isVisible({ timeout: 1000 }).catch(() => false)) {
      await newTaskInMain.click();
      await this.page.waitForTimeout(500);
    }
  }

  // --- Chat input area ---

  messageInput(): Locator {
    // Input có thể là <div contenteditable> (role=textbox), không phải <textarea>
    // getByRole('textbox') match cả hai — placeholder thay đổi giữa new task và follow-up
    return this.page.getByRole('textbox').last();
  }

  /**
   * Bug 2 fix: Send button conflict — có 2 button "Gửi" trên trang.
   * Scope trong form/container của chat input để tránh match "Gửi email campaign".
   */
  sendButton(): Locator {
    // Chỉ dùng title="Gửi" — ổn định hơn CSS classes (có thể thay đổi sau khi AI respond)
    return this.page.locator('button[title="Gửi"]').last();
  }

  async sendMessage(text: string): Promise<void> {
    const input = this.messageInput();
    await input.click();
    // pressSequentially thay vì fill — trigger React onChange để enable send button
    await input.pressSequentially(text, { delay: 20 });
    // Chờ send button enabled sau khi React state cập nhật
    while (await this.sendButton().isDisabled()) { await this.page.waitForTimeout(100); }
    await this.sendButton().click();
  }

  async sendFollowUpMessage(text: string): Promise<void> {
    // Chờ AI xong (Dừng biến mất) rồi mới gửi follow-up
    await this.page.getByRole('button', { name: 'Dừng' }).waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
    const input = this.messageInput();
    await input.click();
    await input.pressSequentially(text, { delay: 20 });
    while (await this.sendButton().isDisabled()) { await this.page.waitForTimeout(100); }
    await this.sendButton().click();
  }

  // --- Messages ---

  userMessage(text: string): Locator {
    // User message hiển thị trong <p> bên trong chat bubble của main
    // Dùng locator('main p') thay vì getByText để match chính xác cấu trúc DOM
    return this.page.locator('main p').filter({ hasText: text }).first();
  }

  aiResponseContent(): Locator {
    return this.page.locator('main p').filter({ hasText: /.{10,}/ }).last();
  }

  async waitForAiResponse(timeout = 30000): Promise<void> {
    // App hiển thị nút "Dừng" khi AI đang generate, "Gửi" khi xong
    // Chờ "Dừng" xuất hiện trước (confirm AI bắt đầu), rồi chờ nó biến mất
    const stopBtn = this.page.getByRole('button', { name: 'Dừng' });
    await stopBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await stopBtn.waitFor({ state: 'hidden', timeout });
    // Buffer nhỏ để UI cập nhật sau khi AI xong
    await this.page.waitForTimeout(300);
  }

  // --- Post-response actions ---

  copyButton(): Locator {
    return this.page.getByRole('button', { name: /copy|sao chép/i }).last();
  }

  retryButton(): Locator {
    // Thử "Tạo lại" (Vietnamese regenerate), "retry", "regenerate"
    return this.page.getByRole('button', { name: /tạo lại|retry|thử lại|regenerate/i }).last()
      .or(this.page.locator(
        'button[title*="tạo lại" i], button[title*="retry" i], button[aria-label*="tạo lại" i], button[aria-label*="regenerate" i]'
      ).last());
  }

  // --- Agent selection ---

  /**
   * Bug 3 fix: Agent selector conflict — có 3 elements với "🐕 Clawgi".
   * Scope trong dropdown/selector container, dùng exact match.
   */
  agentSelector(agentName: string): Locator {
    return this.page.locator('button').filter({ hasText: agentName }).and(this.page.locator('.rounded-xl')).first();
  }
}
