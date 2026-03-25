/**
 * checkly.config.ts
 * 24/7 monitoring cho FPT AI Marketplace API
 *
 * Setup:
 *   1. Tạo account tại app.checklyhq.com
 *   2. cp .env.example .env  →  thêm CHECKLY_ACCOUNT_ID + CHECKLY_API_KEY
 *   3. npx checkly deploy    →  đẩy checks lên cloud
 *   4. npx checkly test      →  chạy thử locally trước khi deploy
 */

import { defineConfig } from 'checkly';
import { Frequency, AlertEscalationBuilder, SmsChannel, EmailAlertChannel, SlackAlertChannel } from 'checkly/constructs';

// ── Alert channels ────────────────────────────────────────────────────────────

const emailAlert = new EmailAlertChannel('email-alert', {
  address: process.env.ALERT_EMAIL || 'thuanlt11@fpt.com',
  sendRecovery: true,
  sendFailure: true,
  sendDegraded: false,
});

const slackAlert = new SlackAlertChannel('slack-alert', {
  url: process.env.SLACK_WEBHOOK_URL || '',
  sendRecovery: true,
  sendFailure: true,
  sendDegraded: false,
});

// ── Main config ───────────────────────────────────────────────────────────────

export default defineConfig({
  projectName: 'FPT AI Marketplace',
  logicalId:   'fpt-ai-marketplace',

  checks: {
    activated:      true,
    muted:          false,
    runtimeId:      '2024.02',
    frequency:      Frequency.EVERY_10M,   // chạy mỗi 10 phút
    locations:      ['ap-southeast-1'],    // Singapore — gần VN nhất
    tags:           ['fpt', 'api', 'production'],
    alertChannels:  [emailAlert, slackAlert],

    // Browser checks — Playwright specs
    browserChecks: {
      testMatch: '**/checkly/browser/**/*.check.ts',
      frequency: Frequency.EVERY_30M,
    },
  },

  cli: {
    runLocation:    'ap-southeast-1',
    privateRunLocation: undefined,
  },
});
