import type { UniqueIdentifier } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import type { FlattenedItem, TreeItem, TreeItems } from './types';

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

function flatten(
  items: TreeItems,
  parentId: UniqueIdentifier | null = null,
  depth = 0,
): FlattenedItem[] {
  return items.reduce<FlattenedItem[]>((acc, item, index) => {
    acc.push({ ...item, parentId, depth, index });
    acc.push(...flatten(item.children, item.id, depth + 1));
    return acc;
  }, []);
}

export function flattenTree(items: TreeItems): FlattenedItem[] {
  return flatten(items);
}

export function buildTree(flattenedItems: FlattenedItem[]): TreeItems {
  const root: TreeItem = { id: 'root', label: '', children: [] };
  const nodes: Record<string, TreeItem> = { [root.id]: root };
  const items = flattenedItems.map((item) => ({ ...item, children: [] }));

  for (const item of items) {
    const { id, children, label } = item;
    const parentId = item.parentId ?? root.id;
    const parent = nodes[parentId] ?? findItem(items, parentId);

    nodes[id] = { id, label, children };
    parent.children.push(item);
  }

  return root.children;
}

export function findItem(items: TreeItem[], itemId: UniqueIdentifier) {
  return items.find(({ id }) => id === itemId);
}

export function findItemDeep(items: TreeItems, itemId: UniqueIdentifier): TreeItem | undefined {
  const item = getItemById(items, itemId);
  return item;
}

export function removeItemById<T extends TreeItem>(
  items: TreeItems<T>,
  id: UniqueIdentifier,
): TreeItems<T> {
  function removeFromChildren(children: TreeItems<T>): TreeItems<T> {
    return children
      .filter((child) => child.id !== id)
      .map((child) => ({
        ...child,
        children: removeFromChildren((child.children as TreeItems<T>) || []),
      }));
  }
  const newItems = removeFromChildren(items);
  return newItems;
}

export function setTreeItemProperties<T extends TreeItem>(
  items: TreeItems<T>,
  id: UniqueIdentifier,
  setter: (value: T) => Partial<T>,
): TreeItems<T> {
  function updateItemInTree(items: TreeItems<T>): TreeItems<T> {
    return items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, ...setter(item) };

        if (updatedItem.children && updatedItem.children.length > 0) {
          updatedItem.children = updateItemInTree(updatedItem.children as TreeItems<T>);
        }

        return updatedItem;
      } else if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: updateItemInTree(item.children as TreeItems<T>),
        };
      } else {
        return item;
      }
    });
  }

  // Start the recursion with the root items
  const newItems = updateItemInTree(items);

  return newItems;
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
  for (const item of items) {
    if (item.id === id) {
      return item;
    } else if (item.children && item.children.length > 0) {
      const foundItem = getItemById(item.children as TreeItems<T>, id);
      if (foundItem) {
        return foundItem;
      }
    }
  }
  return undefined;
}

function countChildren(items: TreeItem[], count = 0): number {
  return items.reduce((acc, { children }) => {
    if (children.length) {
      return countChildren(children, acc + 1);
    }

    return acc + 1;
  }, count);
}

export function getChildCount(treeStructure: TreeItems, id: UniqueIdentifier) {
  const item = findItemDeep(treeStructure, id);

  return item ? countChildren(item.children) : 0;
}

export function removeChildrenOf(items: FlattenedItem[], ids: UniqueIdentifier[]) {
  const excludeParentIds = [...ids];

  return items.filter((item) => {
    if (item.parentId && excludeParentIds.includes(item.parentId)) {
      if (item.children.length) {
        excludeParentIds.push(item.id);
      }
      return false;
    }

    return true;
  });
}
