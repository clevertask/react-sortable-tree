import type { Expect, Page } from '@playwright/test';

export async function expectItemBefore(page: Page, expect: Expect, first: string, second: string) {
  const items = await page.getByRole('treeitem').allTextContents();
  expect(items.indexOf(first)).toBeLessThan(items.indexOf(second));
}
