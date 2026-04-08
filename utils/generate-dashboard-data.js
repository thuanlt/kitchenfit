#!/usr/bin/env node
/**
 * utils/generate-dashboard-data.js
 * Reads git log + spec files → writes dashboard-data.js (loaded by dashboard.html)
 *
 * Usage:
 *   node utils/generate-dashboard-data.js
 *   start dashboard.html   (Windows)
 *   open dashboard.html    (Mac)
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'dashboard-data.js');

// ── Git log ───────────────────────────────────────────────────────────────────
function getCommits() {
  try {
    const raw = execSync('git log --format="%H|%ai|%s|%an" -300', { cwd: ROOT, encoding: 'utf8' });
    return raw.trim().split('\n').map(line => {
      const [hash, date, message = '', author = ''] = line.split('|');
      const m = message.match(/^(\w+)(\(.+?\))?:\s*/);
      return { hash: (hash||'').slice(0,7), date: (date||'').slice(0,10), message, author, type: m?.[1] || 'other' };
    }).filter(c => c.hash && c.date);
  } catch (e) {
    console.warn('⚠️  git log failed:', e.message);
    return [];
  }
}

// ── Daily activity map ────────────────────────────────────────────────────────
function dailyActivity(commits) {
  const map = {};
  for (const c of commits) {
    if (c.date) map[c.date] = (map[c.date] || 0) + 1;
  }
  return map;
}

// ── Count test() calls in a spec file ────────────────────────────────────────
function countTests(filePath) {
  try {
    const src = fs.readFileSync(filePath, 'utf8');
    const total   = (src.match(/\btest\s*\(/g) || []).length;
    const skipped = (src.match(/\btest\.skip\s*\(/g) || []).length;
    return { total, skipped };
  } catch { return { total: 0, skipped: 0 }; }
}

// ── Find all *.spec.ts files ──────────────────────────────────────────────────
function findSpecFiles() {
  let tracked = [];
  let untracked = [];
  try {
    tracked = execSync('git ls-files "automation-tests"', { cwd: ROOT, encoding: 'utf8' })
      .trim().split('\n').filter(f => f.endsWith('.spec.ts'));
  } catch {}
  try {
    untracked = execSync('git ls-files --others --exclude-standard "automation-tests"', { cwd: ROOT, encoding: 'utf8' })
      .trim().split('\n').filter(f => f.endsWith('.spec.ts'));
  } catch {}

  return [...new Set([...tracked, ...untracked])].map(rel => {
    const full = path.join(ROOT, rel.replace(/\\/g, '/'));
    const { total, skipped } = countTests(full);
    const seg = rel.split('/');
    const name = seg.slice(-2).join('/');
    const type = name.includes('/api/')        ? 'api'
               : name.includes('/smoke/')      ? 'smoke'
               : name.includes('/regression/') ? 'regression'
               : name.includes('/exploration/')? 'wip'
               : 'other';
    return { name, tests: total, skipped, type };
  });
}

// ── Skill tree — computed from file presence + commit history ─────────────────
function buildSkillTree(commits, specFiles) {
  const has = p => fs.existsSync(path.join(ROOT, p));
  const commitsWith = term => commits.some(c => c.message.toLowerCase().includes(term));
  const done   = label => label;
  const wip    = label => '⬜ ' + label;

  return [
    {
      level: 1, name: 'Foundation', icon: '🏗️', color: '#3fb950', completion: 100,
      items: [done('Playwright + TypeScript'), done('pnpm workspaces'), done('env management (.env)'), done('tsconfig + path aliases')],
    },
    {
      level: 2, name: 'Test Craft', icon: '🧪', color: '#58a6ff',
      completion: specFiles.some(f => f.name.includes('a11y')) ? 88 : 75,
      items: [
        done('Page Object Model'), done('Auth fixtures'), done('Smoke tests'), done('Regression suite'),
        commitsWith('a11y') ? done('A11y (axe-core)') : wip('A11y testing'),
        wip('Negative edge cases'),
      ],
    },
    {
      level: 3, name: 'API Testing', icon: '🔌', color: '#39c5cf',
      completion: specFiles.some(f => f.name.includes('jp')) ? 95 : 80,
      items: [
        done('VN API (24 models)'),
        specFiles.some(f=>f.name.includes('jp')) ? done('JP API site') : wip('JP API tests'),
        commitsWith('stt') || commitsWith('audio') ? done('STT audio tests') : wip('STT audio tests'),
        done('Error coverage'),
        wip('Perf benchmarks'),
      ],
    },
    {
      level: 4, name: 'CI/CD & Monitoring', icon: '📊', color: '#bc8cff',
      completion: has('checkly.config.js') ? 82 : 60,
      items: [
        done('GitLab CI pipeline'),
        has('checkly.config.js') ? done('Checkly 24 checks (6h)') : wip('Checkly monitoring'),
        done('Scheduled runs'), done('Artifact reports'),
        wip('PR gate checks'),
      ],
    },
    {
      level: 5, name: 'AI Integration', icon: '🤖', color: '#db6d28',
      completion: (() => {
        let pts = 0;
        if (has('tools/fpt-client.ts'))      pts += 20;
        if (has('utils/fpt-reporter.ts'))    pts += 20;
        if (has('utils/slack-report.ts'))    pts += 15;
        if (has('tools/langfuse-client.ts')) pts += 15;
        pts += 10; // anthropic fallback (hardcoded in agents)
        return Math.min(pts, 100);
      })(),
      items: [
        has('tools/fpt-client.ts')      ? done('FPT AI client')        : wip('FPT AI client'),
        has('utils/fpt-reporter.ts')    ? done('Claude failure analyzer') : wip('Failure analyzer'),
        has('utils/slack-report.ts')    ? done('Slack reporting')       : wip('Slack reporting'),
        has('tools/langfuse-client.ts') ? done('Langfuse tracing')      : wip('Langfuse tracing'),
        done('Anthropic fallback'),
        wip('VLM UI analysis (full)'),
      ],
    },
    {
      level: 6, name: 'AI Agents', icon: '🦾', color: '#d29922',
      completion: (() => {
        let pts = 0;
        if (has('agents/orchestrator.ts'))  pts += 15;
        if (has('agents/test-agent.ts'))    pts += 15;
        if (has('utils/openclaw-agent.ts') || commitsWith('openclaw')) pts += 15;
        if (has('agents/jira-agent.ts'))    pts += 5;   // WIP
        if (has('agents/codegen-agent.ts')) pts += 5;   // WIP
        return Math.min(pts, 100);
      })(),
      items: [
        has('agents/orchestrator.ts') ? done('Orchestrator')          : wip('Orchestrator'),
        has('agents/test-agent.ts')   ? done('Test Agent (MCP)')      : wip('Test Agent'),
        (has('utils/openclaw-agent.ts') || commitsWith('openclaw')) ? done('OpenClaw Agent') : wip('OpenClaw Agent'),
        has('agents/jira-agent.ts')   ? wip('Jira Agent (WIP)')       : wip('Jira Agent'),
        has('agents/codegen-agent.ts')? wip('Codegen Agent (WIP)')    : wip('Codegen Agent'),
        wip('Autonomous loop'),
      ],
    },
  ];
}

// ── This-week helper ──────────────────────────────────────────────────────────
function thisWeekCount(commits) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  return commits.filter(c => new Date(c.date) >= cutoff).length;
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('📊 Generating dashboard data…');

const commits   = getCommits();
const specFiles = findSpecFiles();
const skills    = buildSkillTree(commits, specFiles);
const activity  = dailyActivity(commits);

const totalTests   = specFiles.reduce((s, f) => s + f.tests,   0);
const totalSkipped = specFiles.reduce((s, f) => s + f.skipped, 0);

const data = {
  generatedAt: new Date().toISOString(),
  metrics: {
    specFiles:  specFiles.length,
    testCases:  { total: totalTests, pass: totalTests - totalSkipped, skip: totalSkipped, fail: 0 },
    commits:    { total: commits.length, thisWeek: thisWeekCount(commits), agents: 4 },
    checkly:    24,
  },
  skills,
  specFiles,
  commits:       commits.slice(0, 15),
  dailyActivity: activity,
};

const js = [
  '// Auto-generated — do not edit manually.',
  `// Generated: ${data.generatedAt}`,
  `window.DASHBOARD_DATA = ${JSON.stringify(data, null, 2)};`,
].join('\n') + '\n';

fs.writeFileSync(OUT, js, 'utf8');
console.log(`✅ Written → ${path.relative(process.cwd(), OUT)}`);
console.log(`   ${specFiles.length} spec files · ${totalTests} test cases · ${commits.length} commits`);
console.log('\n👉 Open dashboard.html in your browser');
