/**
 * a11y.spec.ts
 * Accessibility tests (WCAG 2.1 AA) cho FPT AI Marketplace
 * Dùng @axe-core/playwright — tự động detect vi phạm WCAG
 *
 * Chạy:
 *   npx cross-env APP_ENV=prod playwright test tests/regression/a11y.spec.ts --project=regression
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { config } from '../../utils/config';

test.describe('Accessibility — FPT AI Marketplace', () => {

  // ── TC_A11Y_001 ────────────────────────────────────────────────────────────
  test('TC_A11Y_001 — Homepage không có lỗi WCAG 2.1 AA', async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto(config.baseUrl);
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log('\n❌ A11Y violations found:');
      for (const v of results.violations) {
        console.log(`  [${v.impact}] ${v.id}: ${v.description}`);
        for (const node of v.nodes) {
          console.log(`    → ${node.html.substring(0, 120)}`);
        }
      }
    }

    expect(
      results.violations,
      `Found ${results.violations.length} WCAG violations on homepage`
    ).toHaveLength(0);

    console.log(`✅ TC_A11Y_001 PASS: 0 violations on homepage`);
  });

  // ── TC_A11Y_002 ────────────────────────────────────────────────────────────
  test('TC_A11Y_002 — My API Keys page không có lỗi WCAG 2.1 AA', async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto(`${config.baseUrl}/my-account?tab=my-api-key`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // chờ dynamic content load

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log('\n❌ A11Y violations found:');
      for (const v of results.violations) {
        console.log(`  [${v.impact}] ${v.id}: ${v.description}`);
      }
    }

    expect(
      results.violations,
      `Found ${results.violations.length} WCAG violations on API Keys page`
    ).toHaveLength(0);

    console.log(`✅ TC_A11Y_002 PASS: 0 violations on My API Keys page`);
  });

  // ── TC_A11Y_003 — Chỉ check critical (impact = critical/serious) ───────────
  test('TC_A11Y_003 — Homepage không có lỗi critical/serious', async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto(config.baseUrl);
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    if (critical.length > 0) {
      console.log('\n❌ Critical A11Y violations:');
      for (const v of critical) {
        console.log(`  [${v.impact}] ${v.id}: ${v.description}`);
        for (const node of v.nodes) {
          console.log(`    → ${node.html.substring(0, 120)}`);
        }
      }
    }

    expect(
      critical,
      `Found ${critical.length} critical/serious WCAG violations`
    ).toHaveLength(0);

    // Log minor issues as warning only (không fail test)
    const minor = results.violations.filter(
      v => v.impact === 'moderate' || v.impact === 'minor'
    );
    if (minor.length > 0) {
      console.log(`⚠️  ${minor.length} minor/moderate violations (non-blocking):`);
      for (const v of minor) console.log(`   [${v.impact}] ${v.id}`);
    }

    console.log(`✅ TC_A11Y_003 PASS: 0 critical/serious violations`);
  });

});
