import type { UniqueIdentifier } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import type {
  DropResult,
  FlattenedItem,
  MoveTreeItemResult,
  TreeItem,
  TreeItems,
  TreeItemsWithChildren,
} from './types';

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
      rawParentId != null && itemsById.has(rawParentId) && rawParentId !== item.id
        ? rawParentId
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
): T | undefined {
  return items.find((item) => item.id === id);
}

export function getTreeItemMoveResult<T extends TreeItem>(
  items: TreeItems<T>,
  targetId: UniqueIdentifier,
): DropResult<T> {
  const targetItem = items.find((item) => item.id === targetId);

  if (!targetItem) {
    return null;
  }

  const { childrenByParentId, normalizedParentById } = buildChildrenByParentId(items);
  const parentId = normalizedParentById.get(targetId) ?? null;
  const siblings = childrenByParentId.get(parentId) ?? [];
  const index = siblings.findIndex((sibling) => sibling.id === targetId);

  if (index === -1) {
    return null;
  }

  const beforeItemId = index > 0 ? siblings[index - 1].id : null;
  const afterItemId = index < siblings.length - 1 ? siblings[index + 1].id : null;
  const movedItem = {
    ...targetItem,
    parentId,
  };

  return {
    movedItem,
    parent: parentId,
    index,
    beforeItemId,
    afterItemId,
  };
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

export type MoveTreeItemPosition = 'before' | 'after' | 'inside';

function getTreeDescendantIds<T extends TreeItem>(
  childrenByParentId: Map<ParentId, T[]>,
  itemId: UniqueIdentifier,
): Set<UniqueIdentifier> {
  const descendants = new Set<UniqueIdentifier>();
  const queue: UniqueIdentifier[] = [itemId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (currentId == null) {
      continue;
    }

    const children = childrenByParentId.get(currentId) ?? [];
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

function flattenFromChildrenMap<T extends TreeItem>(
  itemById: Map<UniqueIdentifier, T>,
  childrenByParentId: Map<ParentId, UniqueIdentifier[]>,
): TreeItems<T> {
  const result: TreeItems<T> = [];
  const visited = new Set<UniqueIdentifier>();

  const visit = (parentId: ParentId) => {
    const children = childrenByParentId.get(parentId) ?? [];

    for (const childId of children) {
      if (visited.has(childId)) {
        continue;
      }

      const child = itemById.get(childId);
      if (!child) {
        continue;
      }

      visited.add(childId);
      result.push(child);
      visit(childId);
    }
  };

  visit(null);

  // Safety net for disconnected/cyclic data.
  for (const item of itemById.values()) {
    if (visited.has(item.id)) {
      continue;
    }
    result.push(item);
  }

  return result;
}

export function moveTreeItem<T extends TreeItem>(
  items: TreeItems<T>,
  itemId: UniqueIdentifier,
  targetItemId: UniqueIdentifier,
  position: MoveTreeItemPosition,
): MoveTreeItemResult<T> {
  if (itemId === targetItemId) {
    return { items, result: null };
  }

  const { childrenByParentId, normalizedParentById } = buildChildrenByParentId(items);

  const itemById = new Map<UniqueIdentifier, T>();
  for (const item of items) {
    itemById.set(item.id, item);
  }

  const item = itemById.get(itemId);
  const target = itemById.get(targetItemId);

  if (!item || !target) {
    return { items, result: null };
  }

  const descendantsOfItem = getTreeDescendantIds(childrenByParentId, itemId);
  if (descendantsOfItem.has(targetItemId)) {
    return { items, result: null };
  }

  const siblingsByParentId = new Map<ParentId, UniqueIdentifier[]>();

  for (const [parentId, siblings] of childrenByParentId.entries()) {
    siblingsByParentId.set(
      parentId,
      siblings.map((sibling) => sibling.id),
    );
  }

  const itemParentId = normalizedParentById.get(itemId) ?? null;
  const itemSiblings = siblingsByParentId.get(itemParentId) ?? [];
  const itemIndex = itemSiblings.indexOf(itemId);

  if (itemIndex >= 0) {
    itemSiblings.splice(itemIndex, 1);
  }

  let destinationParentId: ParentId;
  let destinationIndex: number;

  if (position === 'inside') {
    destinationParentId = targetItemId;
    const destinationSiblings = siblingsByParentId.get(destinationParentId) ?? [];
    destinationIndex = destinationSiblings.length;
  } else {
    destinationParentId = normalizedParentById.get(targetItemId) ?? null;
    const destinationSiblings = siblingsByParentId.get(destinationParentId) ?? [];
    const targetIndex = destinationSiblings.indexOf(targetItemId);

    if (targetIndex < 0) {
      return { items, result: null };
    }

    destinationIndex = position === 'before' ? targetIndex : targetIndex + 1;
  }

  const destinationSiblings = siblingsByParentId.get(destinationParentId) ?? [];

  if (!siblingsByParentId.has(destinationParentId)) {
    siblingsByParentId.set(destinationParentId, destinationSiblings);
  }

  const boundedDestinationIndex = Math.min(
    Math.max(destinationIndex, 0),
    destinationSiblings.length,
  );
  destinationSiblings.splice(boundedDestinationIndex, 0, itemId);

  const nextItemById = new Map(itemById);
  nextItemById.set(itemId, { ...item, parentId: destinationParentId });

  const nextItems = flattenFromChildrenMap(nextItemById, siblingsByParentId);

  return {
    items: nextItems,
    result: getTreeItemMoveResult(nextItems, itemId),
  };
}

export function moveItemBefore<T extends TreeItem>(
  items: TreeItems<T>,
  itemId: UniqueIdentifier,
  targetItemId: UniqueIdentifier,
): MoveTreeItemResult<T> {
  return moveTreeItem(items, itemId, targetItemId, 'before');
}

export function moveItemAfter<T extends TreeItem>(
  items: TreeItems<T>,
  itemId: UniqueIdentifier,
  targetItemId: UniqueIdentifier,
): MoveTreeItemResult<T> {
  return moveTreeItem(items, itemId, targetItemId, 'after');
}

export function moveItemInside<T extends TreeItem>(
  items: TreeItems<T>,
  itemId: UniqueIdentifier,
  targetItemId: UniqueIdentifier,
): MoveTreeItemResult<T> {
  return moveTreeItem(items, itemId, targetItemId, 'inside');
}
