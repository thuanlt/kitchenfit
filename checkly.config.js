/**
 * checkly.config.js
 * 24/7 monitoring cho FPT AI Marketplace API
 */

const { defineConfig } = require('checkly');
const { Frequency, EmailAlertChannel, SlackAlertChannel } = require('checkly/constructs');

const emailAlert = new EmailAlertChannel('email-alert', {
  address:      process.env.ALERT_EMAIL || 'thuanlt11@fpt.com',
  sendRecovery: true,
  sendFailure:  true,
  sendDegraded: false,
});

const slackAlert = new SlackAlertChannel('slack-alert', {
  url:          process.env.SLACK_WEBHOOK_URL || '',
  sendRecovery: true,
  sendFailure:  true,
  sendDegraded: false,
});

module.exports = defineConfig({
  projectName: 'FPT AI Marketplace',
  logicalId:   'fpt-ai-marketplace',

  checks: {
    activated:     true,
    muted:         false,
    runtimeId:     '2024.02',
    frequency:     Frequency.EVERY_10M,
    locations:     ['ap-southeast-1'],
    tags:          ['fpt', 'api', 'production'],
    alertChannels: [emailAlert, slackAlert],

    browserChecks: {
      testMatch: '**/checkly/browser/**/*.spec.js',
      frequency: Frequency.EVERY_30M,
    },
  },

  cli: {
    runLocation: 'ap-southeast-1',
  },
});
