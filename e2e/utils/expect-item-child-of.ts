import type { Page, Expect } from '@playwright/test';
import { getTreeItemId } from './get-tree-item-id';
import { getTreeItem } from './get-tree-item';

export async function expectItemToBeChildOf(
  page: Page,
  expect: Expect,
  child: string,
  parent: string,
) {
  const _child = getTreeItem(page, child);
  const _parent = getTreeItem(page, parent);

  const parentId = await getTreeItemId(_parent);

  await expect(_child).toHaveAttribute('data-tree-item-parent-id', parentId);
}

export async function expectItemNotToBeChildOf(
  page: Page,
  expect: Expect,
  child: string,
  parent: string,
) {
  const _child = getTreeItem(page, child);
  const _parent = getTreeItem(page, parent);

  const parentId = await getTreeItemId(_parent);

  await expect(_child).not.toHaveAttribute('data-tree-item-parent-id', parentId);
}
