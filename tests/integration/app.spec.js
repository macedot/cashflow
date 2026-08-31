import { test, expect } from '@playwright/test';

/* global Chart */

test.describe('Cashflow Simulator App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads without errors', async ({ page }) => {
    await expect(page).toHaveTitle(/Cashflow/i);
  });

  test('displays simulation controls', async ({ page }) => {
    await expect(page.getByText('Initial Balance', { exact: true })).toBeVisible();
    await expect(page.getByText('Start Date', { exact: true })).toBeVisible();
    await expect(page.getByText('End Date', { exact: true })).toBeVisible();
  });

  test('displays events table', async ({ page }) => {
    await expect(page.locator('text=Events')).toBeVisible();
  });

  test('displays chart container', async ({ page }) => {
    // Chart canvas only renders when at least one event exists
    await page.fill('input[placeholder="Event name"]', 'Salary');
    await page.selectOption('select:has(option[value="monthly"])', 'monthly');
    await page.fill('input[placeholder="0.00"]', '1000');
    await page.click('button[title="Add event"]');
    await page.waitForTimeout(500);
    await expect(page.locator('canvas').first()).toBeVisible();
  });

  test('can add a new event', async ({ page }) => {
    await page.fill('input[placeholder="Event name"]', 'Test Income');
    await page.selectOption('select:has(option[value="monthly"])', 'monthly');
    await page.fill('input[placeholder="0.00"]', '1000');
    await page.click('button[title="Add event"]');
    // Monthly recurring event also appears in results table — use .first() to grab the events row
    await expect(page.getByText('Test Income', { exact: true }).first()).toBeVisible();
  });

  test('simulation runs and updates chart', async ({ page }) => {
    await page.fill('input[placeholder="0"]', '1000');
    await page.fill('input[placeholder="Event name"]', 'Salary');
    await page.selectOption('select:has(option[value="monthly"])', 'monthly');
    await page.fill('input[placeholder="0.00"]', '500');
    await page.click('button[title="Add event"]');
    await page.waitForTimeout(500);
    await expect(page.locator('canvas').first()).toBeVisible();
  });

  test('dark mode toggle works', async ({ page }) => {
    const html = page.locator('html');
    const hasDarkClass = await html.evaluate(el => el.classList.contains('dark'));
    await page.click('button[title*="mode"]');
    const hasDarkClassAfter = await html.evaluate(el => el.classList.contains('dark'));
    expect(hasDarkClassAfter).toBe(!hasDarkClass);
  });

  test('CSV export functionality exists', async ({ page }) => {
    await expect(page.locator('text=Export CSV')).toBeVisible();
  });

  test('CSV import functionality exists', async ({ page }) => {
    await expect(page.locator('text=Import CSV')).toBeVisible();
  });

  test('chart tooltip is configured to show balance alongside income/expense', async ({ page }) => {
    // Clear localStorage so chart renders from a known empty state
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Add a monthly event so the chart has data
    await page.fill('input[placeholder="Event name"]', 'Salary');
    await page.selectOption('select:has(option[value="monthly"])', 'monthly');
    await page.fill('input[placeholder="0.00"]', '1000');
    await page.click('button[title="Add event"]');
    await page.waitForTimeout(500);

    const result = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        return { canvasFound: false };
      }
      const chart = Chart.getChart(canvas);
      if (!chart) {
        return { canvasFound: true, chartFound: false };
      }

      const tooltipOpts = chart.options.plugins?.tooltip;
      const interactionOpts = chart.options.interaction;
      const callback = tooltipOpts?.callbacks?.label;

      const sample = callback
        ? {
            balance: callback({ parsed: { y: 1234.56 }, dataset: { label: 'Balance' } }),
            income: callback({ parsed: { y: 500 }, dataset: { label: 'Income' } }),
            expense: callback({ parsed: { y: -200 }, dataset: { label: 'Expense' } }),
          }
        : null;

      return {
        canvasFound: true,
        chartFound: true,
        tooltipMode: tooltipOpts?.mode,
        interactionMode: interactionOpts?.mode,
        sample,
      };
    });

    expect(result.chartFound).toBe(true);
    expect(result.tooltipMode).toBe('index');
    expect(result.interactionMode).toBe('index');
    expect(result.sample).not.toBeNull();
    expect(result.sample.balance).toBe('Balance: 1234.56');
    expect(result.sample.income).toBe('Income: +500.00');
    expect(result.sample.expense).toBe('Expense: -200.00');
  });
});
