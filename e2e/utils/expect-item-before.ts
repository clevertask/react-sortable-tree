import type { Page, Expect } from '@playwright/test';

export async function expectItemBefore(
  page: Page,
  expect: Expect,
  beforeLabel: string,
  afterLabel: string,
) {
  const labels = await page
    .locator('[role="treeitem"] [data-tree-item-label]')
    .evaluateAll((nodes) => nodes.map((n) => n.textContent?.trim()));

  const beforeIndex = labels.indexOf(beforeLabel);
  const afterIndex = labels.indexOf(afterLabel);

  expect(beforeIndex).toBeLessThan(afterIndex);
}
