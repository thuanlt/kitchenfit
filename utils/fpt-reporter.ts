import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

interface FailedTest {
  title: string;
  error: string;
  steps: string[];
  screenshotPath?: string;
}

class AIReporter implements Reporter {
  private failures: FailedTest[] = [];
  private client?: Anthropic;
  private startTime = Date.now();

  onBegin(config: FullConfig, suite: Suite) {
    if (process.env.ANTHROPIC_API_KEY) {
      this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    console.log(`\n🤖 AI Test Reporter active — ${suite.allTests().length} tests queued\n`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'failed' || result.status === 'timedOut') {
      const failure: FailedTest = {
        title: test.titlePath().join(' > '),
        error: result.error?.message ?? 'Unknown error',
        steps: result.steps.map(s => `${s.title} (${s.duration}ms)`),
      };

      // Find screenshot attachment
      const screenshot = result.attachments.find(
        a => a.name === 'screenshot' && a.path
      );
      if (screenshot?.path) {
        failure.screenshotPath = screenshot.path;
      }

      this.failures.push(failure);
    }
  }

  async onEnd(result: FullResult) {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const total = result.status;

    console.log('\n' + '═'.repeat(60));
    console.log(`📊 Test run complete in ${duration}s — Status: ${total}`);
    console.log('═'.repeat(60));

    if (this.failures.length === 0) {
      console.log('✅ All tests passed!\n');
      return;
    }

    console.log(`\n❌ ${this.failures.length} test(s) failed:\n`);
    this.failures.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.title}`);
    });

    // AI root-cause analysis
    if (this.client && this.failures.length > 0) {
      await this.analyseFailures();
    } else {
      this.failures.forEach(f => {
        console.log(`\n📋 ${f.title}\n   Error: ${f.error}\n`);
      });
    }

    // Slack notification
    if (process.env.SLACK_WEBHOOK_URL) {
      await this.sendSlackAlert(result);
    }
  }

  private async analyseFailures() {
    if (!this.client) return;
    console.log('\n🔍 AI analysing failures...\n');

    const prompt = `
Bạn là AI QA Analyst cho FPT Marketplace. Phân tích các test failure sau và đưa ra:
1. Nguyên nhân gốc rễ (root cause)
2. Cách fix nhanh nhất
3. Mức độ nghiêm trọng (Critical / High / Medium / Low)

Test failures:
${this.failures
  .map(
    (f, i) => `
--- Failure ${i + 1} ---
Test: ${f.title}
Error: ${f.error}
Steps executed:
${f.steps.map(s => `  - ${s}`).join('\n')}
`
  )
  .join('\n')}

Trả lời ngắn gọn theo định dạng:
[Failure 1]
Root cause: ...
Fix: ...
Severity: ...
`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      });

      const analysis = response.content
        .filter(b => b.type === 'text')
        .map(b => (b as { type: 'text'; text: string }).text)
        .join('');

      console.log('🤖 AI Root Cause Analysis:');
      console.log('─'.repeat(50));
      console.log(analysis);
      console.log('─'.repeat(50));

      // Save analysis to file
      const reportDir = 'playwright-report';
      if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
      fs.writeFileSync(
        path.join(reportDir, 'ai-analysis.txt'),
        `AI Analysis — ${new Date().toISOString()}\n\n${analysis}`
      );
    } catch (err) {
      console.error('AI analysis failed:', err);
    }
  }

  private async sendSlackAlert(result: FullResult) {
    const webhook = process.env.SLACK_WEBHOOK_URL!;
    const payload = {
      text: `🚨 *FPT Marketplace E2E Tests*`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Status:* ${result.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}\n*Failures:* ${this.failures.length}\n*URL:* ${process.env.BASE_URL}`,
          },
        },
        ...(this.failures.length > 0
          ? [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Failed tests:*\n${this.failures.map(f => `• ${f.title}`).join('\n')}`,
                },
              },
            ]
          : []),
      ],
    };

    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      console.log('\n📣 Slack alert sent');
    } catch {
      console.error('Failed to send Slack alert');
    }
  }
}

export default AIReporter;
