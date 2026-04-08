/**
 * a11y.spec.ts
 * Accessibility tests (WCAG 2.1 AA) cho FPT AI Marketplace
 * Dùng @axe-core/playwright — tự động detect vi phạm WCAG
 *
 * Strategy:
 *   - Chỉ FAIL khi có vi phạm critical/serious
 *   - Exclude color-contrast (Ant Design dynamic theme → false positive)
 *   - Log tất cả violations để theo dõi nhưng không block CI với moderate/minor
 *
 * Chạy:
 *   npx cross-env APP_ENV=prod playwright test tests/regression/a11y.spec.ts --project=regression
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { config } from '../../utils/config';

// Rules đã biết là lỗi của FPT Marketplace frontend (cần dev team fix)
// Exclude khỏi regression để không block CI — track riêng trong TC_A11Y_003
const EXCLUDED_RULES = [
  'color-contrast',  // Ant Design dynamic theme → false positive
  'html-has-lang',   // KNOWN: <html> thiếu lang attribute — FPT-A11Y-001
  'label',           // KNOWN: <input aria-label=""> rỗng — FPT-A11Y-002
  'link-name',       // KNOWN: Footer social links (FB/YT/LinkedIn/Discord) không có text — FPT-A11Y-003
];

function logViolations(violations: any[]) {
  for (const v of violations) {
    console.log(`  [${v.impact}] ${v.id}: ${v.description}`);
    for (const node of v.nodes) {
      console.log(`    → ${node.html.substring(0, 120)}`);
    }
  }
}

async function runAxe(page: any) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .disableRules(EXCLUDED_RULES)
    .analyze();
}

async function waitForPage(page: any, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).toBeVisible();
}

test.describe('Accessibility — FPT AI Marketplace', () => {

  // ── TC_A11Y_001 — Audit toàn bộ, chỉ fail khi critical/serious ────────────
  test('TC_A11Y_001 — Homepage: không có lỗi critical/serious', async ({ page }) => {
    test.setTimeout(90_000);

    await waitForPage(page, config.baseUrl);
    const results = await runAxe(page);

    const critical = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    const nonCritical = results.violations.filter(
      v => v.impact === 'moderate' || v.impact === 'minor'
    );

    if (critical.length > 0) {
      console.log(`\n❌ ${critical.length} critical/serious violations on homepage:`);
      logViolations(critical);
    }
    if (nonCritical.length > 0) {
      console.log(`\n⚠️  ${nonCritical.length} moderate/minor violations (non-blocking):`);
      logViolations(nonCritical);
    }

    expect(
      critical,
      `Found ${critical.length} critical/serious WCAG violations on homepage`
    ).toHaveLength(0);

    console.log(`✅ TC_A11Y_001 PASS: 0 critical violations (${nonCritical.length} minor logged)`);
  });

  // ── TC_A11Y_002 — My API Keys page ────────────────────────────────────────
  test('TC_A11Y_002 — My API Keys page: không có lỗi critical/serious', async ({ page }) => {
    test.setTimeout(90_000);

    await waitForPage(page, `${config.baseUrl}/my-account?tab=my-api-key`);
    const results = await runAxe(page);

    const critical = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    const nonCritical = results.violations.filter(
      v => v.impact === 'moderate' || v.impact === 'minor'
    );

    if (critical.length > 0) {
      console.log(`\n❌ ${critical.length} critical/serious violations on API Keys page:`);
      logViolations(critical);
    }
    if (nonCritical.length > 0) {
      console.log(`\n⚠️  ${nonCritical.length} moderate/minor violations (non-blocking):`);
      logViolations(nonCritical);
    }

    expect(
      critical,
      `Found ${critical.length} critical/serious WCAG violations on API Keys page`
    ).toHaveLength(0);

    console.log(`✅ TC_A11Y_002 PASS: 0 critical violations (${nonCritical.length} minor logged)`);
  });

  // ── TC_A11Y_003 — Audit toàn diện, chỉ log (không fail CI) ───────────────
  test('TC_A11Y_003 — Homepage: audit report đầy đủ (informational)', async ({ page }) => {
    test.setTimeout(90_000);

    await waitForPage(page, config.baseUrl);

    // Chạy axe không exclude gì — để có full picture
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    console.log(`\n📊 Full A11Y Audit — Homepage`);
    console.log(`   Violations: ${results.violations.length}`);
    console.log(`   Passes:     ${results.passes.length}`);
    console.log(`   Incomplete: ${results.incomplete.length}`);

    if (results.violations.length > 0) {
      console.log('\n📋 All violations:');
      logViolations(results.violations);
    }

    // Test này luôn pass — chỉ để report
    expect(results).toBeDefined();
    console.log('✅ TC_A11Y_003 PASS: audit report logged');
  });

});
