import type { Locator, Expect } from '@playwright/test';
import { getTreeItemId } from './get-tree-item-id';

export async function expectItemToBeChildOf(expect: Expect, child: Locator, parent: Locator) {
  const parentId = await getTreeItemId(parent);

  await expect(child).toHaveAttribute('data-tree-item-parent-id', parentId);
}

export async function expectItemNotToBeChildOf(expect: Expect, child: Locator, parent: Locator) {
  const parentId = await getTreeItemId(parent);

  await expect(child).not.toHaveAttribute('data-tree-item-parent-id', parentId);
}
