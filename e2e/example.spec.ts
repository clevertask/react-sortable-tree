import { test, expect } from '@playwright/test';

test('Visible item', async ({ page }) => {
  await page.goto('/');

  const taskADragButton = page.getByLabel('Drag A', { exact: true }); // consumer-wise implementation
  const taskC = page.getByRole('treeitem', { name: 'C' });

  await expect(taskADragButton).toBeVisible();
  await expect(taskC).toBeVisible();

  await taskADragButton.dragTo(taskC);

  await expect(taskADragButton).toHaveCount(1); // If we add the conditional to see if task A is child of Task C we don't need this

  const taskA = page.getByRole('treeitem', { name: 'A' }); // The same thing, instead of naming it droppable, we'd need to call it row or container

  const paddingLeft = await taskA.evaluate((el) => window.getComputedStyle(el).paddingLeft); // The right thing would be doing something like page.getByLabel("Task A") or a way to get the item by the task name, and then check if it has an HTML attribute with something that tells us the item is a child of Task C

  expect(parseFloat(paddingLeft)).toBeGreaterThan(0); // Task A should have an attribute called 'item-parent="Task C"'
});
