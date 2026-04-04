import type { Page, Expect } from '@playwright/test';
import { getTreeItem } from './get-tree-item';

type DragPosition = 'before' | 'after' | 'inside';
type DragBounds = { x: number; y: number; width: number; height: number };

interface DragTarget {
  name: string;
  position: DragPosition;
  horizontalOffset?: number;
}

interface DragItemOptions {
  page: Page;
  expect: Expect;
  from: { name: string };
  to: DragTarget;
  beforeDrop?: {
    waitMs?: number;
    run?: (context: { page: Page; expect: Expect }) => Promise<void>;
    continueTo?: DragTarget;
  };
}

async function getDragCoordinates(
  page: Page,
  expect: Expect,
  fromBox: DragBounds,
  target: DragTarget,
) {
  const targetItem = getTreeItem(page, target.name).locator('[data-tree-draggable]');

  await expect(targetItem).toBeVisible();

  const targetBox = await targetItem.boundingBox();

  if (!targetBox) {
    throw new Error('Could not determine bounding boxes for drag operation');
  }

  let endX = targetBox.x + 8;
  let endY = targetBox.y;

  const PADDING_Y = 4; // avoids border edge cases

  /**
   * When moving from bottom to top. Dnd will move the item before once the dragged item top edge
   * touches the middle or the bottom edge of the target container, so we need to move it
   * before it touches the bottom edge to specify we're putting it after
   */
  const draggingUp = fromBox.y > targetBox.y;

  switch (target.position) {
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
      endX = targetBox.x + targetBox.width * 0.25;

      if (draggingUp) {
        endY = targetBox.y + targetBox.height * 2;
      } else {
        endY = targetBox.y + targetBox.height * 0.75;
      }

      break;
    }
  }

  if (target.horizontalOffset != null) {
    endX = Math.min(targetBox.x + targetBox.width - 8, targetBox.x + target.horizontalOffset);
  }

  return { endX, endY };
}

export async function dragItem({ page, expect, from, to, beforeDrop }: DragItemOptions) {
  const fromHandle = page.getByLabel(`Drag ${from.name}`, { exact: true });

  await expect(fromHandle).toBeVisible();

  const fromBox = await fromHandle.boundingBox();

  if (!fromBox) {
    throw new Error('Could not determine draggable handle bounds');
  }

  const { endX, endY } = await getDragCoordinates(page, expect, fromBox, to);

  const startX = fromBox.x + fromBox.width / 2;
  const startY = fromBox.y + fromBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  // Small move first — helps WebKit register drag start
  await page.mouse.move(startX + 1, startY + 1);

  await page.mouse.move(endX, endY, { steps: 10 });

  await page.evaluate(() => new Promise(requestAnimationFrame));

  if (beforeDrop) {
    await page.waitForTimeout(120);
  }

  if (beforeDrop?.waitMs) {
    await page.waitForTimeout(beforeDrop.waitMs);
  }

  await page.evaluate(() => new Promise(requestAnimationFrame));

  if (beforeDrop?.run) {
    await beforeDrop.run({ page, expect });
  }

  if (beforeDrop?.continueTo) {
    const nextTarget = await getDragCoordinates(page, expect, fromBox, beforeDrop.continueTo);
    await page.mouse.move(nextTarget.endX, nextTarget.endY, { steps: 10 });
  }

  await page.evaluate(() => new Promise(requestAnimationFrame));
  await page.waitForTimeout(120);
  await page.mouse.up();
  await page.waitForTimeout(120);
  await expect(fromHandle).toHaveCount(1);
}
