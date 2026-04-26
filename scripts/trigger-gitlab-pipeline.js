#!/usr/bin/env node

/**
 * GitLab Pipeline Trigger Script
 * 
 * Usage:
 *   node scripts/trigger-gitlab-pipeline.js
 *   node scripts/trigger-gitlab-pipeline.js --env prod
 *   node scripts/trigger-gitlab-pipeline.js --branch develop --suite api
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const GITLAB_URL = process.env.GITLAB_URL || 'https://gitlab.com';
const PROJECT_ID = process.env.GITLAB_PROJECT_ID;
const PRIVATE_TOKEN = process.env.GITLAB_PRIVATE_TOKEN;
const TRIGGER_TOKEN = process.env.GITLAB_TRIGGER_TOKEN;

// Default values
const DEFAULT_REF = 'master';
const DEFAULT_ENV = 'stg';

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    ref: DEFAULT_REF,
    env: DEFAULT_ENV,
    suite: null,
    variables: {},
    useTriggerToken: false,
    dryRun: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--ref':
      case '--branch':
        options.ref = nextArg;
        i++;
        break;
      case '--env':
        options.env = nextArg;
        i++;
        break;
      case '--suite':
        options.suite = nextArg;
        i++;
        break;
      case '--var':
        const [key, value] = nextArg.split('=');
        if (key && value) {
          options.variables[key] = value;
        }
        i++;
        break;
      case '--trigger-token':
        options.useTriggerToken = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
GitLab Pipeline Trigger Script

Usage:
  node scripts/trigger-gitlab-pipeline.js [options]

Options:
  --ref, --branch <branch>    Branch to run pipeline on (default: master)
  --env <environment>          Environment: stg, prod, jp (default: stg)
  --suite <suite>             Test suite: smoke, regression, api
  --var <key=value>           Custom variable
  --trigger-token             Use trigger token instead of private token
  --dry-run                   Show what would be triggered without actually triggering
  --help, -h                  Show this help message

Examples:
  # Trigger regression tests on staging
  node scripts/trigger-gitlab-pipeline.js --env stg --suite regression

  # Trigger API tests on production
  node scripts/trigger-gitlab-pipeline.js --env prod --suite api --branch master

  # Trigger with custom variables
  node scripts/trigger-gitlab-pipeline.js --var BASE_URL=https://custom.url

  # Dry run to see what would be triggered
  node scripts/trigger-gitlab-pipeline.js --env prod --dry-run

Environment Variables:
  GITLAB_URL              GitLab instance URL (default: https://gitlab.com)
  GITLAB_PROJECT_ID       Project ID or path (e.g., namespace/project)
  GITLAB_PRIVATE_TOKEN    Personal access token (api scope)
  GITLAB_TRIGGER_TOKEN    Pipeline trigger token
`);
}

/**
 * Validate configuration
 */
function validateConfig(options) {
  const errors = [];

  if (!PROJECT_ID) {
    errors.push('GITLAB_PROJECT_ID is required');
  }

  if (options.useTriggerToken) {
    if (!TRIGGER_TOKEN) {
      errors.push('GITLAB_TRIGGER_TOKEN is required when using --trigger-token');
    }
  } else {
    if (!PRIVATE_TOKEN) {
      errors.push('GITLAB_PRIVATE_TOKEN is required');
    }
  }

  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\nPlease set the required environment variables in .env file');
    process.exit(1);
  }
}

/**
 * Trigger pipeline using private token
 */
async function triggerWithPrivateToken(options) {
  const url = `${GITLAB_URL}/api/v4/projects/${encodeURIComponent(PROJECT_ID)}/pipeline`;
  
  const data = {
    ref: options.ref,
    variables: {
      APP_ENV: options.env,
      ...options.variables
    }
  };

  if (options.suite) {
    data.variables.TEST_SUITE = options.suite;
  }

  const headers = {
    'PRIVATE-TOKEN': PRIVATE_TOKEN,
    'Content-Type': 'application/json'
  };

  console.log('\n=== Pipeline Trigger Info ===');
  console.log(`URL: ${url}`);
  console.log(`Branch: ${options.ref}`);
  console.log(`Environment: ${options.env}`);
  if (options.suite) console.log(`Suite: ${options.suite}`);
  console.log(`Variables:`, JSON.stringify(data.variables, null, 2));

  if (options.dryRun) {
    console.log('\n[DRY RUN] Pipeline would be triggered with the above configuration.');
    return null;
  }

  try {
    console.log('\nTriggering pipeline...');
    const response = await axios.post(url, data, { headers });
    
    console.log('\n✅ Pipeline triggered successfully!');
    console.log(`Pipeline ID: ${response.data.id}`);
    console.log(`Web URL: ${response.data.web_url}`);
    console.log(`Status: ${response.data.status}`);
    console.log(`Created at: ${response.data.created_at}`);
    
    return response.data;
  } catch (error) {
    console.error('\n❌ Failed to trigger pipeline:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Message: ${error.response.data.message || JSON.stringify(error.response.data)}`);
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

/**
 * Trigger pipeline using trigger token
 */
async function triggerWithTriggerToken(options) {
  const url = `${GITLAB_URL}/api/v4/projects/${encodeURIComponent(PROJECT_ID)}/trigger/pipeline`;
  
  const formData = new URLSearchParams();
  formData.append('token', TRIGGER_TOKEN);
  formData.append('ref', options.ref);
  
  // Add variables
  const variables = {
    APP_ENV: options.env,
    ...options.variables
  };
  
  if (options.suite) {
    variables.TEST_SUITE = options.suite;
  }
  
  Object.entries(variables).forEach(([key, value]) => {
    formData.append(`variables[${key}]`, value);
  });

  console.log('\n=== Pipeline Trigger Info ===');
  console.log(`URL: ${url}`);
  console.log(`Branch: ${options.ref}`);
  console.log(`Environment: ${options.env}`);
  if (options.suite) console.log(`Suite: ${options.suite}`);
  console.log(`Variables:`, JSON.stringify(variables, null, 2));

  if (options.dryRun) {
    console.log('\n[DRY RUN] Pipeline would be triggered with the above configuration.');
    return null;
  }

  try {
    console.log('\nTriggering pipeline...');
    const response = await axios.post(url, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('\n✅ Pipeline triggered successfully!');
    console.log(`Pipeline ID: ${response.data.id}`);
    console.log(`Web URL: ${response.data.web_url}`);
    console.log(`Status: ${response.data.status}`);
    console.log(`Created at: ${response.data.created_at}`);
    
    return response.data;
  } catch (error) {
    console.error('\n❌ Failed to trigger pipeline:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Message: ${error.response.data.message || JSON.stringify(error.response.data)}`);
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

/**
 * Wait for pipeline to complete
 */
async function waitForPipeline(pipelineId, options) {
  const url = `${GITLAB_URL}/api/v4/projects/${encodeURIComponent(PROJECT_ID)}/pipelines/${pipelineId}`;
  const headers = {
    'PRIVATE-TOKEN': PRIVATE_TOKEN
  };

  console.log(`\nWaiting for pipeline ${pipelineId} to complete...`);
  console.log('Press Ctrl+C to stop waiting (pipeline will continue running)');

  const pollInterval = 10000; // 10 seconds
  let status = 'pending';

  while (status === 'pending' || status === 'running') {
    try {
      const response = await axios.get(url, { headers });
      status = response.data.status;
      
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Status: ${status}`);
      
      if (status === 'success') {
        console.log('\n✅ Pipeline completed successfully!');
        return response.data;
      } else if (status === 'failed' || status === 'canceled' || status === 'skipped') {
        console.log(`\n❌ Pipeline ${status}!`);
        console.log(`View details: ${response.data.web_url}`);
        return response.data;
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error('Error polling pipeline status:', error.message);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const options = parseArgs();
    validateConfig(options);

    console.log('========================================');
    console.log('  GitLab Pipeline Trigger');
    console.log('========================================');

    let result;
    if (options.useTriggerToken) {
      result = await triggerWithTriggerToken(options);
    } else {
      result = await triggerWithPrivateToken(options);
    }

    if (result && !options.dryRun) {
      // Optionally wait for pipeline to complete
      // await waitForPipeline(result.id, options);
      
      console.log('\n========================================');
      console.log('Pipeline triggered successfully!');
      console.log('========================================');
    }

  } catch (error) {
    console.error('\nFatal error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { triggerWithPrivateToken, triggerWithTriggerToken, waitForPipeline };
