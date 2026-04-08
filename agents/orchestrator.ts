/**
 * agents/orchestrator.ts
 * Top-level agent router — điều phối toàn bộ agent pipeline.
 *
 * Usage:
 *   npx ts-node agents/orchestrator.ts --agent test [--flow login] [--url ...]
 *   npx ts-node agents/orchestrator.ts --agent codegen [--qwen] "task"
 *   npx ts-node agents/orchestrator.ts --agent jira NCPP-XXXX [--post] [--dry]
 *   npx ts-node agents/orchestrator.ts --agent report [--env prod]
 */

import { spawnSync } from 'child_process';
import path from 'path';

// ── CLI parsing ───────────────────────────────────────────────────────────────
const args      = process.argv.slice(2);
const agentIdx  = args.indexOf('--agent');
const agentType = agentIdx !== -1 ? args[agentIdx + 1] : undefined;
const restArgs  = args.filter((_, i) => i !== agentIdx && i !== agentIdx + 1);

// ── Agent registry ────────────────────────────────────────────────────────────
const AGENTS: Record<string, { script: string; description: string }> = {
  test:    { script: 'agents/test-agent.ts',    description: 'E2E browser testing via Playwright MCP' },
  codegen: { script: 'agents/codegen-agent.ts', description: 'Generate Playwright tests from task description' },
  jira:    { script: 'agents/jira-agent.ts',    description: 'Jira ticket → test cases → Playwright script' },
  report:  { script: 'utils/slack-report.ts',   description: 'Run all suites and post results to Slack' },
};

// ── Help ──────────────────────────────────────────────────────────────────────
if (!agentType || agentType === 'help') {
  console.log('\n🤖 FPT Marketplace AI Orchestrator\n');
  console.log('Usage: npx ts-node agents/orchestrator.ts --agent <type> [args]\n');
  console.log('Available agents:');
  for (const [name, { description }] of Object.entries(AGENTS)) {
    console.log(`  ${name.padEnd(10)} — ${description}`);
  }
  console.log('\nExamples:');
  console.log('  --agent test --flow login');
  console.log('  --agent test --flow checkout --url https://staging.marketplace.fpt.ai');
  console.log('  --agent codegen "Write test for filter-by-category feature"');
  console.log('  --agent codegen --qwen "Write test for search"');
  console.log('  --agent jira NCPP-6392 --post');
  console.log('  --agent report');
  process.exit(0);
}

const agent = AGENTS[agentType];
if (!agent) {
  console.error(`❌ Unknown agent: "${agentType}". Run with --agent help to see available agents.`);
  process.exit(1);
}

// ── Dispatch ──────────────────────────────────────────────────────────────────
console.log(`\n🎯 Orchestrator dispatching → [${agentType}] ${agent.description}`);
console.log(`   Args: ${restArgs.join(' ') || '(none)'}\n`);

const result = spawnSync(
  'npx',
  ['ts-node', path.resolve(__dirname, '..', agent.script), ...restArgs],
  {
    cwd:      path.resolve(__dirname, '..'),
    stdio:    'inherit',
    encoding: 'utf-8',
    shell:    true,
    env:      { ...process.env },
  },
);

process.exit(result.status ?? 0);
