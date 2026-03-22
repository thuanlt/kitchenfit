/**
 * glm-analyze-results.ts
 * Uses GLM-4.7 (FPT Cloud) to analyze Playwright test results and produce insights.
 *
 * Usage:
 *   npx ts-node utils/glm-analyze-results.ts                     # reads reports/test-results.json
 *   npx ts-node utils/glm-analyze-results.ts path/to/results.json
 */
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { callFptModel } from './fpt-agent';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function callGLM(prompt: string, maxTokens = 1024): Promise<{ content: string; usage: any }> {
  return callFptModel('GLM-4.7', [{ role: 'user', content: prompt }], { maxTokens, temperature: 0.3 });
}

interface TestResult {
  title:    string;
  status:   'passed' | 'failed' | 'skipped' | 'timedOut';
  duration: number;
  errors?:  string[];
}

function parseJsonReport(filePath: string): TestResult[] {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const results: TestResult[] = [];

  function walk(suite: any) {
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests ?? []) {
          const result = test.results?.[0];
          results.push({
            title:    spec.title,
            status:   result?.status ?? 'skipped',
            duration: result?.duration ?? 0,
            errors:   result?.errors?.map((e: any) => e.message?.substring(0, 200)),
          });
        }
      }
    }
    for (const child of suite.suites ?? []) walk(child);
  }

  for (const suite of raw.suites ?? []) walk(suite);
  return results;
}

function buildSummary(results: TestResult[]): string {
  const passed  = results.filter(r => r.status === 'passed');
  const failed  = results.filter(r => r.status === 'failed');
  const skipped = results.filter(r => r.status === 'skipped');
  const avgMs   = passed.length
    ? Math.round(passed.reduce((s, r) => s + r.duration, 0) / passed.length)
    : 0;
  const slowest = [...passed].sort((a, b) => b.duration - a.duration).slice(0, 5);

  return `
## Test Run Summary
- Total: ${results.length} | Passed: ${passed.length} | Failed: ${failed.length} | Skipped: ${skipped.length}
- Pass rate: ${((passed.length / results.length) * 100).toFixed(1)}%
- Avg duration (passed): ${avgMs}ms

## Failed Tests (${failed.length})
${failed.map(r => `- [FAIL] ${r.title}\n  Error: ${r.errors?.[0] ?? 'unknown'}`).join('\n') || 'None'}

## Slowest Passed Tests
${slowest.map(r => `- ${r.title}: ${r.duration}ms`).join('\n') || 'None'}

## Skipped Tests (${skipped.length})
${skipped.map(r => `- ${r.title}`).join('\n') || 'None'}
`.trim();
}

async function analyzeResults(resultsPath: string): Promise<void> {
  if (!fs.existsSync(resultsPath)) {
    console.error(`❌ File not found: ${resultsPath}`);
    console.error('   Run tests first with: npm run test:api -- --reporter=json');
    console.error('   Or add JSON reporter to playwright.config.ts');
    process.exit(1);
  }

  const results = parseJsonReport(resultsPath);
  const summary = buildSummary(results);

  console.log('\n📋 Test Summary:\n');
  console.log(summary);

  const prompt = `You are a QA lead reviewing Playwright API test results for FPT AI Marketplace.
The marketplace exposes AI model inference APIs (chat completions, embeddings, rerank, audio STT/TTS).

## Test Results:
${summary}

## Task:
Provide a professional analysis in Vietnamese with:
1. **Tổng quan** — Đánh giá tổng thể kết quả test
2. **Phân tích lỗi** — Nguyên nhân có thể của các test thất bại (nếu có)
3. **Hiệu suất** — Nhận xét về tốc độ response của các model
4. **Rủi ro** — Các rủi ro cần chú ý
5. **Đề xuất** — Hành động tiếp theo cụ thể

Keep it concise and actionable.`;

  console.log('\n🤖 GLM-4.7 đang phân tích kết quả...\n');

  const { content, usage } = await callGLM(prompt, 1024);
  console.log(`📊 Tokens — prompt: ${usage?.prompt_tokens}, completion: ${usage?.completion_tokens}, total: ${usage?.total_tokens}\n`);
  console.log('─'.repeat(60));
  console.log('🧠 Phân tích từ GLM-4.7:');
  console.log('─'.repeat(60));
  console.log(content);

  // Save analysis report
  const reportOut = path.resolve(__dirname, '../reports/glm-analysis.md');
  const reportContent = `# GLM-4.7 Test Analysis\nDate: ${new Date().toISOString()}\n\n## Raw Summary\n\`\`\`\n${summary}\n\`\`\`\n\n## GLM-4.7 Analysis\n${content}`;
  fs.mkdirSync(path.dirname(reportOut), { recursive: true });
  fs.writeFileSync(reportOut, reportContent, 'utf-8');
  console.log(`\n✅ Analysis saved to: ${reportOut}`);
}

const inputFile = process.argv[2] ?? path.resolve(__dirname, '../reports/test-results.json');
analyzeResults(inputFile).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
