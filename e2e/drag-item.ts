import { Page, expect } from '@playwright/test';

type DragPosition = 'before' | 'after' | 'inside';

interface DragItemOptions {
  page: Page;
  from: { name: string };
  to: { name: string; position: DragPosition };
}

export async function dragItem({ page, from, to }: DragItemOptions) {
  const fromHandle = page.getByLabel(`Drag ${from.name}`, { exact: true });
  const targetItem = page.getByRole('treeitem', { name: to.name });

  await expect(fromHandle).toBeVisible();
  await expect(targetItem).toBeVisible();

  const fromBox = await fromHandle.boundingBox();
  const targetBox = await targetItem.boundingBox();

  if (!fromBox || !targetBox) {
    throw new Error('Could not determine bounding boxes for drag operation');
  }

  const startX = fromBox.x + fromBox.width / 2;
  const startY = fromBox.y + fromBox.height / 2;

  let endX = targetBox.x + 8;
  let endY = targetBox.y;

  const PADDING_Y = 4; // avoids border edge cases

  switch (to.position) {
    case 'before':
      endY = targetBox.y + PADDING_Y;
      break;

    case 'after':
      endY = targetBox.y + targetBox.height - PADDING_Y;
      break;

    case 'inside': {
      const draggable = targetItem.locator('[data-tree-draggable]');
      const draggableBox = await draggable.boundingBox();

      if (!draggableBox) {
        throw new Error('Could not determine draggable item bounds');
      }

      endX = draggableBox.x + draggableBox.width * 0.05;
      endY = draggableBox.y + draggableBox.height * 0.75;
      break;
    }
  }

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  // Small move first — helps WebKit register drag start
  await page.mouse.move(startX + 1, startY + 1);

  await page.mouse.move(endX, endY, { steps: 10 });

  await page.evaluate(() => new Promise(requestAnimationFrame));
  await page.mouse.up();
}
