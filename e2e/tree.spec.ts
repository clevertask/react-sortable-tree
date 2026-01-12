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

  await expectItemToBeChildOf(page, expect, 'A', 'C');
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
  await expectItemNotToBeChildOf(page, expect, 'A', 'C');
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
  await expectItemNotToBeChildOf(page, expect, 'C', 'A');
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

test('Item A becomes child of B1 when dragged inside', async ({ page }) => {
  await page.goto('/');

  await dragItem({
    page,
    expect,
    from: { name: 'A' },
    to: { name: 'B1', position: 'inside' },
  });

  await expectItemToBeChildOf(page, expect, 'A', 'B1');
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

test('First item A can be moved after last item E', async ({ page }) => {
  await page.goto('/');

  await dragItem({
    page,
    expect,
    from: { name: 'A' },
    to: { name: 'E', position: 'after' },
  });

  await expectItemBefore(page, expect, 'E', 'A');
});
