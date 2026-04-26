#!/usr/bin/env node

/**
 * Script to trigger FPT CLAW E2E test pipeline
 * Usage: node trigger-fpt-claw-e2e.js
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  GITLAB_URL: process.env.GITLAB_URL || 'gitlab.fci.vn',
  PROJECT_ID: process.env.GITLAB_PROJECT_ID || 'ncp-product/automation-testing/ncp_cloud/ai-factory/modas',
  PRIVATE_TOKEN: process.env.GITLAB_PRIVATE_TOKEN,
  REF: process.env.GITLAB_REF || 'master',
  VARIABLES: {
    APP_ENV: 'stg',
    FPT_CLAW_URL: 'https://stg-claw.fptcloud.net'
  }
};

// Validate configuration
if (!CONFIG.PRIVATE_TOKEN) {
  console.error('❌ Error: GITLAB_PRIVATE_TOKEN environment variable is required');
  console.error('Usage: GITLAB_PRIVATE_TOKEN=xxx node trigger-fpt-claw-e2e.js');
  process.exit(1);
}

// Encode project ID for URL
const encodedProjectId = encodeURIComponent(CONFIG.PROJECT_ID);

// Prepare request data
const requestData = {
  ref: CONFIG.REF,
  variables: Object.entries(CONFIG.VARIABLES).map(([key, value]) => ({
    key,
    value,
    variable_type: 'env_var'
  }))
};

console.log('🚀 Triggering FPT CLAW E2E Test Pipeline...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📍 GitLab URL: ${CONFIG.GITLAB_URL}`);
console.log(`📦 Project ID: ${CONFIG.PROJECT_ID}`);
console.log(`🌿 Branch: ${CONFIG.REF}`);
console.log(`🌐 Target URL: ${CONFIG.VARIABLES.FPT_CLAW_URL}`);
console.log(`🔧 Environment: ${CONFIG.VARIABLES.APP_ENV}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Make API request
const options = {
  hostname: CONFIG.GITLAB_URL,
  port: 443,
  path: `/api/v4/projects/${encodedProjectId}/pipeline`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'PRIVATE-TOKEN': CONFIG.PRIVATE_TOKEN
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const result = JSON.parse(data);
        console.log('✅ Pipeline triggered successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🔢 Pipeline ID: ${result.id}`);
        console.log(`🔗 Pipeline URL: ${result.web_url}`);
        console.log(`📊 Status: ${result.status}`);
        console.log(`👤 Created by: ${result.user.username}`);
        console.log(`🕐 Created at: ${result.created_at}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💡 Tip: Use the URL above to track pipeline progress');
      } catch (error) {
        console.error('❌ Error parsing response:', error.message);
        console.error('Response:', data);
        process.exit(1);
      }
    } else {
      console.error(`❌ Error: HTTP ${res.statusCode}`);
      console.error('Response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error making request:', error.message);
  process.exit(1);
});

req.write(JSON.stringify(requestData));
req.end();

// Add helpful tips
setTimeout(() => {
  console.log('\n📋 Next steps:');
  console.log('   1. Open the pipeline URL to track progress');
  console.log('   2. Check the fpt-claw-e2e-stg job for test execution');
  console.log('   3. Download artifacts to view test reports');
  console.log('   4. Review test results and fix any failures');
  console.log('\n⏱️  Estimated duration: ~30-45 minutes');
  console.log('📧 You will receive notifications when the pipeline completes');
}, 1000);
