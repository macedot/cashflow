import { test, expect } from '@playwright/test';

/* global Chart, Buffer, getComputedStyle */

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

    // Zero-line plugin must draw in afterDatasetsDraw: its old afterDraw
    // hook ran after the Tooltip plugin's own afterDraw, painting the
    // y=0 highlight line on top of the tooltip.
    const axisHighlightHook = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const chart = canvas && Chart.getChart(canvas);
      const plugin =
        chart && chart.config.plugins
          ? chart.config.plugins.find(e => e.id === 'axisHighlight')
          : null;
      return (
        Boolean(plugin) &&
        typeof plugin.afterDatasetsDraw === 'function' &&
        plugin.afterDraw === undefined
      );
    });

    expect(result.chartFound).toBe(true);
    expect(result.tooltipMode).toBe('index');
    expect(result.interactionMode).toBe('index');
    expect(result.sample).not.toBeNull();
    expect(result.sample.balance).toBe('Balance: 1234.56');
    expect(result.sample.income).toBe('Income: +500.00');
    expect(result.sample.expense).toBe('Expense: -200.00');
    expect(axisHighlightHook).toBe(true);
  });

  // date inputs order: simStart, simEnd, new-event startDate, new-event endDate
  const resultsTable = page => page.locator('table.w-full.text-sm');

  test('expense stops recurring after its end date', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.locator('input[type="date"]').nth(0).fill('2025-01-01'); // sim start
    await page.locator('input[type="date"]').nth(1).fill('2025-06-30'); // sim end
    await page.fill('input[placeholder="Event name"]', 'Rent');
    await page.locator('input[type="date"]').nth(2).fill('2025-01-01'); // event start
    await page.locator('input[type="date"]').nth(3).fill('2025-03-01'); // event end
    await page.selectOption('select:has(option[value="monthly"])', 'monthly');
    await page.fill('input[placeholder="0.00"]', '-1500');
    await page.click('button[title="Add event"]');

    const table = resultsTable(page);
    await expect(table.locator('tr', { hasText: '2025-01-01' })).toHaveCount(1);
    await expect(table.locator('tr', { hasText: '2025-02-01' })).toHaveCount(1);
    await expect(table.locator('tr', { hasText: '2025-03-01' })).toHaveCount(1);
    await expect(table.locator('tr', { hasText: '2025-04-01' })).toHaveCount(0);
    await expect(table.locator('tr', { hasText: '2025-05-01' })).toHaveCount(0);
    await expect(table.locator('tr', { hasText: '2025-06-01' })).toHaveCount(0);
  });

  test('CSV import auto-fixes unambiguous dates and reports skipped rows', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.locator('input[type="date"]').nth(0).fill('2025-01-01'); // sim start
    await page.locator('input[type="date"]').nth(1).fill('2025-06-30'); // sim end

    const csv = [
      'name,startDate,endDate,frequency,value,currency',
      'Rent,15/01/2025,15/03/2025,monthly,-100,USD',
      'Ghost,15/01/2025,31/02/2025,monthly,-100,USD',
    ].join('\n');
    await page.setInputFiles('input[type="file"]', {
      name: 'events.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv, 'utf8'),
    });

    await expect(page.locator('text=1 date(s) auto-fixed')).toBeVisible();
    await expect(page.locator('text=1 invalid date(s)')).toBeVisible();

    const table = resultsTable(page);
    // Rent appears in the Items column on each of its 3 occurrence dates
    await expect(table.locator('tr', { hasText: 'Rent' })).toHaveCount(3);
    await expect(table.locator('tr', { hasText: '2025-01-15' })).toHaveCount(1);
    await expect(table.locator('tr', { hasText: '2025-03-15' })).toHaveCount(1);
    await expect(table.locator('tr', { hasText: '2025-04-15' })).toHaveCount(0);
    await expect(page.getByText('Ghost', { exact: true })).toHaveCount(0);
  });

  test('Fork me on GitHub ribbon links to the repo', async ({ page }) => {
    const ribbon = page.locator('a.github-fork-ribbon');
    await expect(ribbon).toBeVisible();
    await expect(ribbon).toHaveText('Fork me on GitHub');
    await expect(ribbon).toHaveAttribute('href', 'https://github.com/macedot/cashflow');
    await expect(ribbon).toHaveAttribute('target', '_blank');
    await expect(ribbon).toHaveAttribute('rel', /noopener/);
    await expect(ribbon).toHaveAttribute('data-ribbon', 'Fork me on GitHub');
    // Yellow theme override from src/style.css must win over the CDN default red
    const bg = await ribbon.evaluate(el => getComputedStyle(el, '::before').backgroundColor);
    expect(bg).toBe('rgb(255, 215, 0)');
  });

  // date inputs order: simStart, simEnd, new-event startDate, new-event endDate
  const resultsTable = page => page.locator('table.w-full.text-sm');

  test('expense stops recurring after its end date', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.locator('input[type="date"]').nth(0).fill('2025-01-01'); // sim start
    await page.locator('input[type="date"]').nth(1).fill('2025-06-30'); // sim end
    await page.fill('input[placeholder="Event name"]', 'Rent');
    await page.locator('input[type="date"]').nth(2).fill('2025-01-01'); // event start
    await page.locator('input[type="date"]').nth(3).fill('2025-03-01'); // event end
    await page.selectOption('select:has(option[value="monthly"])', 'monthly');
    await page.fill('input[placeholder="0.00"]', '-1500');
    await page.click('button[title="Add event"]');

    const table = resultsTable(page);
    await expect(table.locator('tr', { hasText: '2025-01-01' })).toHaveCount(1);
    await expect(table.locator('tr', { hasText: '2025-02-01' })).toHaveCount(1);
    await expect(table.locator('tr', { hasText: '2025-03-01' })).toHaveCount(1);
    await expect(table.locator('tr', { hasText: '2025-04-01' })).toHaveCount(0);
    await expect(table.locator('tr', { hasText: '2025-05-01' })).toHaveCount(0);
    await expect(table.locator('tr', { hasText: '2025-06-01' })).toHaveCount(0);
  });

  test('CSV import auto-fixes unambiguous dates and reports skipped rows', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.locator('input[type="date"]').nth(0).fill('2025-01-01'); // sim start
    await page.locator('input[type="date"]').nth(1).fill('2025-06-30'); // sim end

    const csv = [
      'name,startDate,endDate,frequency,value,currency',
      'Rent,15/01/2025,15/03/2025,monthly,-100,USD',
      'Ghost,15/01/2025,31/02/2025,monthly,-100,USD',
    ].join('\n');
    await page.setInputFiles('input[type="file"]', {
      name: 'events.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv, 'utf8'),
    });

    await expect(page.locator('text=1 date(s) auto-fixed')).toBeVisible();
    await expect(page.locator('text=1 invalid date(s)')).toBeVisible();

    const table = resultsTable(page);
    // Rent appears in the Items column on each of its 3 occurrence dates
    await expect(table.locator('tr', { hasText: 'Rent' })).toHaveCount(3);
    await expect(table.locator('tr', { hasText: '2025-01-15' })).toHaveCount(1);
    await expect(table.locator('tr', { hasText: '2025-03-15' })).toHaveCount(1);
    await expect(table.locator('tr', { hasText: '2025-04-15' })).toHaveCount(0);
    await expect(page.getByText('Ghost', { exact: true })).toHaveCount(0);
  });

  test('Fork me on GitHub ribbon links to the repo', async ({ page }) => {
    const ribbon = page.locator('a.github-ribbon');
    await expect(ribbon).toBeVisible();
    await expect(ribbon).toHaveText('Fork me on GitHub');
    await expect(ribbon).toHaveAttribute('href', 'https://github.com/macedot/cashflow');
    await expect(ribbon).toHaveAttribute('target', '_blank');
    await expect(ribbon).toHaveAttribute('rel', /noopener/);
  });
});
