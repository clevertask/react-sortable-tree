import type { UniqueIdentifier } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import type { FlattenedItem, TreeItem, TreeItems, TreeItemsWithChildren } from './types';

export const iOS = /iPad|iPhone|iPod/.test(navigator.platform);

function getDragDepth(offset: number, indentationWidth: number) {
  return Math.round(offset / indentationWidth);
}

export function getProjection(
  items: FlattenedItem[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
  dragOffset: number,
  indentationWidth: number,
) {
  const overItemIndex = items.findIndex(({ id }) => id === overId);
  const activeItemIndex = items.findIndex(({ id }) => id === activeId);
  const activeItem = items[activeItemIndex];
  const newItems = arrayMove(items, activeItemIndex, overItemIndex);
  const previousItem = newItems[overItemIndex - 1];
  const nextItem = newItems[overItemIndex + 1];
  const dragDepth = getDragDepth(dragOffset, indentationWidth);
  const projectedDepth = activeItem.depth + dragDepth;
  const maxDepth = getMaxDepth({
    previousItem,
  });
  const minDepth = getMinDepth({ nextItem });
  let depth = projectedDepth;

  if (projectedDepth >= maxDepth) {
    depth = maxDepth;
  } else if (projectedDepth < minDepth) {
    depth = minDepth;
  }

  return { depth, maxDepth, minDepth, parentId: getParentId() };

  function getParentId() {
    if (depth === 0 || !previousItem) {
      return null;
    }

    if (depth === previousItem.depth) {
      return previousItem.parentId;
    }

    if (depth > previousItem.depth) {
      return previousItem.id;
    }

    const newParent = newItems
      .slice(0, overItemIndex)
      .reverse()
      .find((item) => item.depth === depth)?.parentId;

    return newParent ?? null;
  }
}

function getMaxDepth({ previousItem }: { previousItem: FlattenedItem }) {
  if (previousItem) {
    return previousItem.depth + 1;
  }

  return 0;
}

function getMinDepth({ nextItem }: { nextItem: FlattenedItem }) {
  if (nextItem) {
    return nextItem.depth;
  }

  return 0;
}

type ParentId = UniqueIdentifier | null;

function buildChildrenByParentId<T extends TreeItem>(items: TreeItems<T>) {
  const itemsById = new Map<UniqueIdentifier, T>();

  for (const item of items) {
    itemsById.set(item.id, item);
  }

  const childrenByParentId = new Map<ParentId, T[]>();
  const normalizedParentById = new Map<UniqueIdentifier, ParentId>();

  for (const item of items) {
    const rawParentId = item.parentId ?? null;
    const normalizedParentId =
      rawParentId != null && itemsById.has(rawParentId) && rawParentId !== item.id ?
        rawParentId
      : null;

    normalizedParentById.set(item.id, normalizedParentId);

    const siblings = childrenByParentId.get(normalizedParentId);
    if (siblings) {
      siblings.push(item);
    } else {
      childrenByParentId.set(normalizedParentId, [item]);
    }
  }

  return { childrenByParentId, normalizedParentById };
}

function getDescendantIds<T extends TreeItem>(
  items: TreeItems<T>,
  parentIds: UniqueIdentifier[],
): Set<UniqueIdentifier> {
  const { childrenByParentId } = buildChildrenByParentId(items);
  const descendants = new Set<UniqueIdentifier>();
  const queue = [...parentIds];

  while (queue.length > 0) {
    const parentId = queue.shift();
    if (parentId == null) {
      continue;
    }
    const children = childrenByParentId.get(parentId) ?? [];
    for (const child of children) {
      if (descendants.has(child.id)) {
        continue;
      }
      descendants.add(child.id);
      queue.push(child.id);
    }
  }

  return descendants;
}

export function buildFlattenedItems<T extends TreeItem>(items: TreeItems<T>): FlattenedItem<T>[] {
  const { childrenByParentId, normalizedParentById } = buildChildrenByParentId(items);
  const flattened: FlattenedItem<T>[] = [];
  const visited = new Set<UniqueIdentifier>();

  const visit = (parentId: ParentId, depth: number) => {
    const children = childrenByParentId.get(parentId) ?? [];

    children.forEach((item, index) => {
      if (visited.has(item.id)) {
        return;
      }

      visited.add(item.id);
      const normalizedParentId = normalizedParentById.get(item.id) ?? null;
      flattened.push({ ...item, parentId: normalizedParentId, depth, index });
      visit(item.id, depth + 1);
    });
  };

  visit(null, 0);

  // Safety net for cyclic or disconnected graphs.
  for (const item of items) {
    if (visited.has(item.id)) {
      continue;
    }

    const normalizedParentId = normalizedParentById.get(item.id) ?? null;
    const siblings = childrenByParentId.get(normalizedParentId) ?? [];
    const index = siblings.findIndex((sibling) => sibling.id === item.id);

    flattened.push({
      ...item,
      parentId: normalizedParentId,
      depth: 0,
      index: index >= 0 ? index : 0,
    });
    visit(item.id, 1);
  }

  return flattened;
}

function flattenLegacyTree<T extends TreeItem>(
  items: TreeItemsWithChildren<T>,
  parentId: UniqueIdentifier | null = null,
  depth = 0,
): FlattenedItem<T>[] {
  return items.reduce<FlattenedItem<T>[]>((acc, item, index) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { children, parentId: _ignoredParentId, ...rest } = item;
    acc.push({ ...rest, parentId, depth, index });
    acc.push(...flattenLegacyTree(children, item.id, depth + 1));
    return acc;
  }, []);
}

export function flattenTree<T extends TreeItem>(
  items: TreeItemsWithChildren<T>,
): FlattenedItem<T>[] {
  return flattenLegacyTree(items);
}

export function convertTreeToFlatItems<T extends TreeItem>(
  items: TreeItemsWithChildren<T>,
): TreeItems<T> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return flattenTree(items).map(({ depth, index, ...rest }) => rest) as TreeItems<T>;
}

export function removeItemById<T extends TreeItem>(
  items: TreeItems<T>,
  id: UniqueIdentifier,
): TreeItems<T> {
  const idsToRemove = getDescendantIds(items, [id]);
  idsToRemove.add(id);

  return items.filter((item) => !idsToRemove.has(item.id));
}

export function setTreeItemProperties<T extends TreeItem>(
  items: TreeItems<T>,
  id: UniqueIdentifier,
  setter: (value: T) => Partial<T>,
): TreeItems<T> {
  return items.map((item) => {
    if (item.id !== id) {
      return item;
    }

    return { ...item, ...setter(item) };
  });
}

/**
 * Retrieves a tree item by its unique identifier.
 * @param structure The current tree items array
 * @param id The unique identifier of the item to retrieve.
 * @returns The tree item if found, undefined otherwise.
 */
export function getItemById<T extends TreeItem>(
  items: TreeItems<T>,
  id: UniqueIdentifier,
): TreeItem<T> | undefined {
  return items.find((item) => item.id === id);
}

export function getChildCount(items: TreeItems, id: UniqueIdentifier) {
  return getDescendantIds(items, [id]).size;
}

export function getChildrenCountById<T extends TreeItem>(items: TreeItems<T>) {
  const counts = new Map<UniqueIdentifier, number>();

  for (const item of items) {
    const parentId = item.parentId;
    if (parentId == null) {
      continue;
    }
    counts.set(parentId, (counts.get(parentId) ?? 0) + 1);
  }

  return counts;
}

export function removeChildrenOf(items: FlattenedItem[], ids: UniqueIdentifier[]) {
  const descendantIds = getDescendantIds(items, ids);
  return items.filter((item) => !descendantIds.has(item.id));
}
