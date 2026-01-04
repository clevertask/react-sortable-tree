import { test, expect } from '@playwright/test';

test('Visible item', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Hello', { exact: true })).toBeVisible();
});
