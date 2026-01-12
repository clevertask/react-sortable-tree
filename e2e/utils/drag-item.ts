import type { Page, Expect } from '@playwright/test';

type DragPosition = 'before' | 'after' | 'inside';

interface DragItemOptions {
  page: Page;
  expect: Expect;
  from: { name: string };
  to: { name: string; position: DragPosition };
}

export async function dragItem({ page, expect, from, to }: DragItemOptions) {
  const fromHandle = page.getByLabel(`Drag ${from.name}`, { exact: true });
  const targetItem = page
    .getByRole('treeitem', {
      name: to.name,
      exact: true,
    })
    .locator('[data-tree-draggable]');

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

  const draggingUp = fromBox.y > targetBox.y;

  switch (to.position) {
    case 'before': {
      endY = targetBox.y + PADDING_Y;

      if (draggingUp) {
        endY += fromBox.height;
      }

      break;
    }

    case 'after': {
      endY = targetBox.y + targetBox.height - PADDING_Y;

      if (draggingUp) {
        endY += fromBox.height;
      }

      break;
    }

    case 'inside': {
      const draggableBox = await targetItem.boundingBox();

      if (!draggableBox) {
        throw new Error('Could not determine draggable item bounds');
      }
      console.log(draggingUp);

      endX = draggableBox.x + draggableBox.width * 0.25;

      if (draggingUp) {
        /**
         * When moving from bottom to top. Dnd will move the item before once the dragged item top edge
         * touches the middle or the bottom edge of the target container, so we need to move it
         * before it touches the bottom edge to specify we're putting it after
         */
        const result = draggableBox.y + draggableBox.height * 2;
        endY = result;
      } else {
        const result = draggableBox.y + draggableBox.height * 0.75;
        endY = result;
      }

      break;
    }
  }

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  // Small move first — helps WebKit register drag start
  await page.mouse.move(startX + 1, startY + 1);

  await page.mouse.move(endX, endY, { steps: 10 });

  await page.evaluate(() => new Promise(requestAnimationFrame));
  await page.waitForTimeout(120);
  await page.mouse.up();
  await page.waitForTimeout(120);
  await expect(fromHandle).toHaveCount(1);
}
