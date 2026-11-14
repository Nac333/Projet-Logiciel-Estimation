import { test, expect } from '@playwright/test';

// Smoke test only. PDF measurements and business calculations need separate fixtures.
test('the real application opens without uncaught JavaScript errors', async ({ page }, testInfo) => {
  const uncaughtErrors = [];
  const diagnostics = [];
  page.on('pageerror', error => uncaughtErrors.push(error.stack || error.message));
  page.on('console', message => {
    if (message.type() === 'error') diagnostics.push({ type: 'console', message: message.text() });
  });
  page.on('requestfailed', request => diagnostics.push({
    type: 'network', url: request.url(), error: request.failure()?.errorText
  }));

  try {
    const response = await page.goto('/Quantif-Plancher-V7.html', { waitUntil: 'load' });
    expect(response, 'The application must return an HTTP response').not.toBeNull();
    expect(response.status(), 'The application document must load').toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    await expect(page).toHaveTitle(/\S/);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).toContainText(/\S/);

    // Generic startup contract: an application control, not an empty or error page.
    const control = page.locator('button:visible:not([disabled]), input[type="button"]:visible:not([disabled]), input[type="submit"]:visible:not([disabled]), [role="button"]:visible:not([aria-disabled="true"])').first();
    await expect(control, 'At least one application control must be visible').toBeVisible();
    await expect(control).toBeEnabled();
    await testInfo.attach('application-startup', {
      body: await page.screenshot({ fullPage: true }), contentType: 'image/png'
    });
    expect(uncaughtErrors, 'Uncaught JavaScript errors during startup').toEqual([]);
  } finally {
    await testInfo.attach('startup-diagnostics', {
      body: Buffer.from(JSON.stringify({ uncaughtErrors, diagnostics }, null, 2)),
      contentType: 'application/json'
    });
  }
});
