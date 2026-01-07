import { test, expect } from '@playwright/test';
import { dragItem } from './drag-item';

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
