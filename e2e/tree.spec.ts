import { test, expect } from '@playwright/test';
import {
  dragItem,
  expectItemBefore,
  expectItemNotToBeChildOf,
  expectItemToBeChildOf,
} from './utils';

test.afterEach(async ({ page }) => {
  await page.reload();
});

test('Item A becomes a child of C after drag and drop', async ({ page }) => {
  await page.goto('/');

  await dragItem({
    page,
    expect,
    from: { name: 'A' },
    to: { name: 'C', position: 'inside' },
  });

  const taskA = page.getByRole('treeitem', { name: 'A' });
  const taskC = page.getByRole('treeitem', { name: 'C' });
  await expectItemToBeChildOf(expect, taskA, taskC);
});

test('Item A is moved below C after drag and drop', async ({ page }) => {
  await page.goto('/');

  await dragItem({
    page,
    expect,
    from: { name: 'A' },
    to: { name: 'C', position: 'after' },
  });

  await expectItemBefore(page, expect, 'C', 'A');

  const taskA = page.getByRole('treeitem', { name: 'A' });
  const taskC = page.getByRole('treeitem', { name: 'C' });
  await expectItemNotToBeChildOf(expect, taskA, taskC);
});

test('Item C is moved before A after drag and drop', async ({ page }) => {
  await page.goto('/');

  await dragItem({
    page,
    expect,
    from: { name: 'C' },
    to: { name: 'A', position: 'before' },
  });

  await expectItemBefore(page, expect, 'C', 'A');

  const taskC = page.getByRole('treeitem', { name: 'C' });
  const taskA = page.getByRole('treeitem', { name: 'A' });
  await expectItemNotToBeChildOf(expect, taskC, taskA);
});
