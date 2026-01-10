import type { Locator } from '@playwright/test';

export async function getTreeItemId(locator: Locator) {
  const id = await locator.getAttribute('data-tree-item-id');

  if (!id) {
    throw new Error('Tree item does not have data-tree-item-id');
  }

  return id;
}
