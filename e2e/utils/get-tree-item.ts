import type { Page, Locator } from '@playwright/test';

export function getTreeItem(page: Page, name: string, options?: { exact?: boolean }): Locator {
  return page.getByRole('treeitem', {
    name,
    exact: options?.exact ?? true,
  });
}
