import { test, expect } from '@playwright/test';
import { dragItem } from './drag-item';

test.afterEach(async ({ page }) => {
  await page.reload();
});

test('Item A becomes a child of C after drag and drop', async ({ page }) => {
  await page.goto('/');

  const taskADragButton = page.getByLabel('Drag A', { exact: true });
  const taskC = page.getByRole('treeitem', { name: 'C' });

  await expect(taskADragButton).toBeVisible();
  await expect(taskC).toBeVisible();

  await dragItem({
    page,
    from: { name: 'A' },
    to: { name: 'C', position: 'inside' },
  });

  const nestedA = page.getByRole('treeitem', { name: 'A' });
  await expect(nestedA).toHaveAttribute('data-tree-item-parent-id', 'c');
});

test('Item A is moved below C after drag and drop', async ({ page }) => {
  await page.goto('/');

  const taskA = page.getByRole('treeitem', { name: 'A' });
  const taskC = page.getByRole('treeitem', { name: 'C' });

  await expect(taskA).toBeVisible();
  await expect(taskC).toBeVisible();

  await dragItem({
    page,
    from: { name: 'A' },
    to: { name: 'C', position: 'bottom' },
  });

  const allItems = page.getByRole('treeitem');
  const texts = await allItems.allTextContents();

  const indexC = texts.indexOf('C');
  const indexA = texts.indexOf('A');

  expect(indexA).toBe(indexC + 1);

  // Extra safety: ensure A is NOT nested
  await expect(taskA).not.toHaveAttribute('data-tree-item-parent-id', 'c');
});

test('Item C is moved before A after drag and drop', async ({ page }) => {
  await page.goto('/');

  const taskC = page.getByRole('treeitem', { name: 'C' });
  const taskA = page.getByRole('treeitem', { name: 'A' });

  await expect(taskC).toBeVisible();
  await expect(taskA).toBeVisible();

  await dragItem({
    page,
    from: { name: 'C' },
    to: { name: 'A', position: 'top' },
  });

  const allItems = page.getByRole('treeitem');
  const texts = await allItems.allTextContents();

  const indexC = texts.indexOf('C');
  const indexA = texts.indexOf('A');

  expect(indexC).toBe(indexA - 1);

  // Extra safety: ensure C is NOT nested
  await expect(taskC).not.toHaveAttribute('data-tree-item-parent-id', 'a');
});
