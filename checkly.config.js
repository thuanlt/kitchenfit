/**
 * checkly.config.js
 * 24/7 monitoring cho FPT AI Marketplace API
 */

const { defineConfig } = require('checkly');
const { Frequency, WebhookAlertChannel } = require('checkly/constructs');

const teamsAlert = new WebhookAlertChannel('teams-alert', {
  name:         'Teams — Market Place',
  url:          'https://fptsoftware362.webhook.office.com/webhookb2/72622222-d807-4e7b-be4c-17c9ecdb0dd0@f01e930a-b52e-42b1-b70f-a8882b5d043b/IncomingWebhook/0103aeb623d34ae581d44745bb0a28a8/470adf17-29d5-475a-964e-a41e0bfc21c5/V2luBj_NzOQ75KBpuWtNYvWhABlnFbsBMOXZ-_es4SJTY1',
  method:       'POST',
  template:     JSON.stringify({
    "@type":    "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "0078D4",
    "summary":  "{{ALERT_TITLE}}",
    "sections": [{
      "activityTitle":    "{{ALERT_TITLE}}",
      "activitySubtitle": "Check: **{{CHECK_NAME}}**",
      "facts": [
        { "name": "Status",        "value": "{{ALERT_TYPE}}" },
        { "name": "Location",      "value": "{{RUN_LOCATION}}" },
        { "name": "Response time", "value": "{{RESPONSE_TIME}}ms" },
        { "name": "Error body",    "value": "{{RESPONSE_BODY}}" }
      ],
      "potentialAction": [{
        "@type": "OpenUri",
        "name":  "View Result",
        "targets": [{ "os": "default", "uri": "{{CHECK_RESULT_LINK}}" }]
      }]
    }]
  }),
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
    frequency:     Frequency.EVERY_1H,
    locations:     ['ap-southeast-1'],
    tags:          ['fpt', 'api', 'production'],
    alertChannels: [teamsAlert],

    browserChecks: {
      testMatch: '**/checkly/browser/**/*.spec.js',
      frequency: Frequency.EVERY_30M,
    },
  },

  cli: {
    runLocation: 'ap-southeast-1',
  },
});
