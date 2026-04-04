import { test, expect } from '@playwright/test';
import {
  dragItem,
  expectItemBefore,
  expectItemNotToBeChildOf,
  expectItemToBeChildOf,
  getTreeItem,
} from './utils';

test.afterEach(async ({ page }) => {
  await page.reload();
});

test('Item D becomes a child of C after drag and drop', async ({ page }) => {
  await page.goto('/');

  await dragItem({
    page,
    expect,
    from: { name: 'D' },
    to: { name: 'C', position: 'inside' },
  });

  await expectItemToBeChildOf(page, expect, 'D', 'C');
});

test('Collapsed parents auto-expand when dragging indicates nesting into them', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Toggle A collapse', exact: true }).click();
  await expect(getTreeItem(page, 'Z')).toHaveCount(0);

  await dragItem({
    page,
    expect,
    from: { name: 'C' },
    to: { name: 'B', position: 'before', horizontalOffset: 80 },
    beforeDrop: {
      waitMs: 1500,
      run: async ({ page, expect }) => {
        await expect(getTreeItem(page, 'Z')).toHaveCount(1);
      },
      continueTo: { name: 'Z', position: 'before' },
    },
  });

  await expectItemToBeChildOf(page, expect, 'C', 'A');
});

test('Item D is moved below C after drag and drop', async ({ page }) => {
  await page.goto('/');

  await dragItem({
    page,
    expect,
    from: { name: 'D' },
    to: { name: 'C', position: 'after' },
  });

  await expectItemBefore(page, expect, 'C', 'D');
  await expectItemNotToBeChildOf(page, expect, 'D', 'C');
});

test('Item C is moved before D after drag and drop', async ({ page }) => {
  await page.goto('/');

  await dragItem({
    page,
    expect,
    from: { name: 'C' },
    to: { name: 'D', position: 'before' },
  });

  await expectItemBefore(page, expect, 'C', 'D');
  await expectItemNotToBeChildOf(page, expect, 'C', 'D');
});

test('Item C is moved before nested item B1 after drag and drop', async ({ page }) => {
  await page.goto('/');

  await dragItem({
    page,
    expect,
    from: { name: 'C' },
    to: { name: 'B1', position: 'before' },
  });

  await expectItemBefore(page, expect, 'C', 'B1');
  await expectItemToBeChildOf(page, expect, 'C', 'B');
});

test('Item C is moved after nested item B1 after drag and drop', async ({ page }) => {
  await page.goto('/');

  await dragItem({
    page,
    expect,
    from: { name: 'C' },
    to: { name: 'B1', position: 'after' },
  });

  await expectItemBefore(page, expect, 'B1', 'C');
  await expectItemToBeChildOf(page, expect, 'C', 'B');
});

test('Item C is moved after nested item B1 and then before it after drag and drop', async ({
  page,
}) => {
  await page.goto('/');

  await dragItem({
    page,
    expect,
    from: { name: 'C' },
    to: { name: 'B1', position: 'after' },
  });

  await expectItemBefore(page, expect, 'B1', 'C');
  await expectItemToBeChildOf(page, expect, 'C', 'B');

  await dragItem({
    page,
    expect,
    from: { name: 'C' },
    to: { name: 'B1', position: 'before' },
  });

  await expectItemBefore(page, expect, 'C', 'B1');
  await expectItemToBeChildOf(page, expect, 'C', 'B');
});

test('Item B cannot be moved inside its own child B1', async ({ page }) => {
  await page.goto('/');

  await dragItem({
    page,
    expect,
    from: { name: 'B' },
    to: { name: 'B1', position: 'inside' },
  });

  await expectItemNotToBeChildOf(page, expect, 'B', 'B1');
});

test('Nested item B1 can be moved to top level', async ({ page }) => {
  await page.goto('/');

  await dragItem({
    page,
    expect,
    from: { name: 'B1' },
    to: { name: 'E', position: 'after' },
  });

  await expectItemNotToBeChildOf(page, expect, 'B1', 'B');
});

test('Item Z becomes child of B1 when dragged inside', async ({ page }) => {
  await page.goto('/');

  await dragItem({
    page,
    expect,
    from: { name: 'Z' },
    to: { name: 'B1', position: 'inside' },
  });

  await expectItemToBeChildOf(page, expect, 'Z', 'B1');
});

test('Last item E can be moved before first item A', async ({ page }) => {
  await page.goto('/');

  await dragItem({
    page,
    expect,
    from: { name: 'E' },
    to: { name: 'A', position: 'before' },
  });

  await expectItemBefore(page, expect, 'E', 'A');
});

test('First item A can be moved after last item E and keep Z as child', async ({ page }) => {
  await page.goto('/');

  await dragItem({
    page,
    expect,
    from: { name: 'A' },
    to: { name: 'E', position: 'after' },
  });

  await expectItemBefore(page, expect, 'E', 'A');
  await expectItemToBeChildOf(page, expect, 'Z', 'A');
});

test('Programmatic button can move B1 after Z', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Move B1 after Z', exact: true }).click();

  await expectItemBefore(page, expect, 'Z', 'B1');
  await expectItemToBeChildOf(page, expect, 'B1', 'A');
  await expectItemNotToBeChildOf(page, expect, 'B1', 'B');
});

test('Reset tree restores the original parent after a programmatic move', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Move B1 after Z', exact: true }).click();
  await page.getByRole('button', { name: 'Reset tree', exact: true }).click();

  await expectItemToBeChildOf(page, expect, 'B1', 'B');
  await expectItemNotToBeChildOf(page, expect, 'B1', 'A');
});

test('Programmatic button can move A and B before E as a bulk block', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Move A + B before E', exact: true }).click();

  await expectItemBefore(page, expect, 'D', 'A');
  await expectItemBefore(page, expect, 'A', 'B');
  await expectItemBefore(page, expect, 'B', 'E');
  await expectItemToBeChildOf(page, expect, 'Z', 'A');
  await expectItemToBeChildOf(page, expect, 'B1', 'B');
});

test('Programmatic button can move A and B after C as a bulk block', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Move A + B after C', exact: true }).click();

  await expectItemBefore(page, expect, 'C', 'A');
  await expectItemBefore(page, expect, 'A', 'B');
  await expectItemBefore(page, expect, 'B', 'D');
  await expectItemToBeChildOf(page, expect, 'Z', 'A');
  await expectItemToBeChildOf(page, expect, 'B1', 'B');
});

test('Programmatic button can move A and B inside C while preserving their subtrees', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Move A + B inside C', exact: true }).click();

  await expectItemToBeChildOf(page, expect, 'A', 'C');
  await expectItemToBeChildOf(page, expect, 'B', 'C');
  await expectItemToBeChildOf(page, expect, 'Z', 'A');
  await expectItemToBeChildOf(page, expect, 'B1', 'B');
});

test('Programmatic button can extract a selected descendant and move it with its parent', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Extract A + Z inside C', exact: true }).click();

  await expectItemToBeChildOf(page, expect, 'A', 'C');
  await expectItemToBeChildOf(page, expect, 'Z', 'C');
  await expectItemNotToBeChildOf(page, expect, 'Z', 'A');
  await expectItemBefore(page, expect, 'A', 'Z');
});

test('Programmatic button can remove B and its subtree', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Remove B', exact: true }).click();

  await expect(page.getByRole('treeitem', { name: 'B', exact: true })).toHaveCount(0);
  await expect(page.getByRole('treeitem', { name: 'B1', exact: true })).toHaveCount(0);
  await expect(page.getByRole('treeitem', { name: 'A', exact: true })).toHaveCount(1);
});

test('Programmatic bulk removal ignores overlapping parent and child ids', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Remove A + Z', exact: true }).click();

  await expect(page.getByRole('treeitem', { name: 'A', exact: true })).toHaveCount(0);
  await expect(page.getByRole('treeitem', { name: 'Z', exact: true })).toHaveCount(0);
  await expect(page.getByRole('treeitem', { name: 'B', exact: true })).toHaveCount(1);
});
