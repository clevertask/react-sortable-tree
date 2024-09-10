import type { UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import type { FlattenedItem, OptimizedTreeStructure, TreeItem, TreeItems } from "./types";

export const iOS = /iPad|iPhone|iPod/.test(navigator.platform);

function getDragDepth(offset: number, indentationWidth: number) {
  return Math.round(offset / indentationWidth);
}

export function getProjection(
  items: FlattenedItem[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
  dragOffset: number,
  indentationWidth: number
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

function flatten(items: TreeItems, parentId: UniqueIdentifier | null = null, depth = 0): FlattenedItem[] {
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
  const root: TreeItem = { id: "root", children: [] };
  const nodes: Record<string, TreeItem> = { [root.id]: root };
  const items = flattenedItems.map((item) => ({ ...item, children: [] }));

  for (const item of items) {
    const { id, children } = item;
    const parentId = item.parentId ?? root.id;
    const parent = nodes[parentId] ?? findItem(items, parentId);

    nodes[id] = { id, children };
    parent.children.push(item);
  }

  return root.children;
}

export function findItem(items: TreeItem[], itemId: UniqueIdentifier) {
  return items.find(({ id }) => id === itemId);
}

export function findItemDeep(items: TreeItems, itemId: UniqueIdentifier): TreeItem | undefined {
  for (const item of items) {
    const { id, children } = item;

    if (id === itemId) {
      return item;
    }

    if (children.length) {
      const child = findItemDeep(children, itemId);

      if (child) {
        return child;
      }
    }
  }

  return undefined;
}

export function removeItemById(structure: OptimizedTreeStructure, id: UniqueIdentifier): OptimizedTreeStructure {
  const { items, itemMap } = structure;
  const newMap = new Map(itemMap);

  function removeFromChildren(children: TreeItems): TreeItems {
    return children.filter((child) => {
      if (child.id === id) {
        newMap.delete(id);
        return false;
      }
      if (child.children.length) {
        child.children = removeFromChildren(child.children);
      }
      return true;
    });
  }

  const newItems = removeFromChildren(items);

  return { items: newItems, itemMap: newMap };
}

export function setTreeItemProperties(
  structure: OptimizedTreeStructure,
  id: UniqueIdentifier,
  setter: (value: TreeItem) => Partial<TreeItem>
): OptimizedTreeStructure {
  const { items, itemMap } = structure;
  const item = itemMap.get(id);

  if (!item) return structure; // Item not found, return unchanged

  const updatedItem = { ...item, ...setter(item) };
  const newMap = new Map(itemMap);
  newMap.set(id, updatedItem);

  function updateInTree(children: TreeItem[]): TreeItem[] {
    return children.map((child) => {
      if (child.id === id) {
        // Update the map with all new children
        if (updatedItem.children) {
          updatedItem.children.forEach((newChild) => {
            newMap.set(newChild.id, newChild);
          });
        }
        return updatedItem;
      }
      if (child.children.length) {
        return { ...child, children: updateInTree(child.children) };
      }
      return child;
    });
  }

  const newItems = updateInTree(items);

  return { items: newItems, itemMap: newMap };
}

// Helper function to create initial optimized structure
export function createOptimizedTreeStructure(items: TreeItems): OptimizedTreeStructure {
  const itemMap = new Map<UniqueIdentifier, TreeItem>();

  function addToMap(item: TreeItem) {
    itemMap.set(item.id, item);
    item.children.forEach(addToMap);
  }

  items.forEach(addToMap);

  return { items, itemMap };
}

function countChildren(items: TreeItem[], count = 0): number {
  return items.reduce((acc, { children }) => {
    if (children.length) {
      return countChildren(children, acc + 1);
    }

    return acc + 1;
  }, count);
}

export function getChildCount(items: TreeItems, id: UniqueIdentifier) {
  const item = findItemDeep(items, id);

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
