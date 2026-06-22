import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DragDropProvider,
  DragOverlay,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/react';
import { PointerActivationConstraints, PointerSensor, type DragDropManager } from '@dnd-kit/dom';
import { isKeyboardEvent } from '@dnd-kit/dom/utilities';
import { arrayMove } from '@dnd-kit/helpers';
import type { ActivationConstraints, Sensors, UniqueIdentifier } from '@dnd-kit/abstract';

import {
  buildFlattenedItems,
  getTreeItemMoveResult,
  getProjectionFromDepth,
  getDragDepth,
  getChildCount,
  getChildrenCountById,
  getDescendantIds,
  removeItemById,
  removeChildrenOf,
  setTreeItemProperties,
} from './utilities';
import type {
  FlattenedItem,
  SortableTreeDragActivationConstraints,
  SortableTreeProps,
  TreeItem,
  TreeItems,
} from './types';
import { SortableTreeItem, TreeItem as TreeItemComponent } from './components';

const TREE_ITEM_DROP_EDGE_TOLERANCE = 8;

type ProjectedTreePosition = {
  depth: number;
  parentId: UniqueIdentifier | null;
};

function getConstraintForPointerType(
  pointerType: string,
  dragActivationConstraints: SortableTreeDragActivationConstraints | undefined,
) {
  if (pointerType === 'touch') {
    return dragActivationConstraints?.touch;
  }

  if (pointerType === 'pen') {
    if (dragActivationConstraints?.pen !== undefined) {
      return dragActivationConstraints.pen;
    }

    return dragActivationConstraints?.mouse;
  }

  return dragActivationConstraints?.mouse;
}

function toPointerActivationConstraints(
  constraint: SortableTreeDragActivationConstraints[keyof SortableTreeDragActivationConstraints],
): ActivationConstraints<PointerEvent> {
  if (constraint == null) {
    return [];
  }

  const constraints: ActivationConstraints<PointerEvent> = [];

  if (constraint.distance != null) {
    constraints.push(
      new PointerActivationConstraints.Distance({
        value: constraint.distance,
        tolerance: constraint.tolerance,
      }),
    );
  }

  if (constraint.delay != null) {
    constraints.push(
      new PointerActivationConstraints.Delay({
        value: constraint.delay,
        tolerance: constraint.tolerance ?? 0,
      }),
    );
  }

  return constraints;
}

function getDragPositionY(manager: DragDropManager, isDraggingUp: boolean) {
  const currentShape = manager.dragOperation.shape?.current;

  if (currentShape && isDraggingUp) {
    return currentShape.boundingRectangle.top;
  }

  return currentShape?.center.y ?? manager.dragOperation.position.current.y;
}

function moveItemByTargetPosition<T extends TreeItem>(
  items: FlattenedItem<T>[],
  sourceId: UniqueIdentifier,
  targetId: UniqueIdentifier,
  isBelowTarget: boolean,
) {
  if (sourceId === targetId) {
    return items;
  }

  const sourceIndex = items.findIndex(({ id }) => id === sourceId);

  if (sourceIndex < 0) {
    return items;
  }

  const sourceItem = items[sourceIndex];
  const withoutSource = items.filter(({ id }) => id !== sourceId);
  const targetIndex = withoutSource.findIndex(({ id }) => id === targetId);

  if (targetIndex < 0 || !sourceItem) {
    return items;
  }

  const insertionIndex = targetIndex + (isBelowTarget ? 1 : 0);

  return [
    ...withoutSource.slice(0, insertionIndex),
    sourceItem,
    ...withoutSource.slice(insertionIndex),
  ];
}

function getTreeItemTargetAtY<T extends TreeItem>({
  items,
  sourceId,
  y,
  container,
}: {
  items: FlattenedItem<T>[];
  sourceId: UniqueIdentifier;
  y: number;
  container: HTMLElement | null;
}) {
  const itemIds = new Set(items.map(({ id }) => String(id)));
  const elements = [
    ...(container ?? document).querySelectorAll<HTMLElement>('[data-tree-item-id]'),
  ];
  let closestTarget: { id: UniqueIdentifier; centerY: number; distance: number } | null = null;

  for (const element of elements) {
    const targetId = element.dataset.treeItemId;

    if (!targetId || targetId === String(sourceId) || !itemIds.has(targetId)) {
      continue;
    }

    const item = items.find(({ id }) => String(id) === targetId);

    if (!item) {
      continue;
    }

    const rect = element.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;

    if (y >= rect.top && y <= rect.bottom) {
      return {
        id: item.id,
        centerY,
      };
    }

    const distance = Math.abs(centerY - y);

    if (!closestTarget || distance < closestTarget.distance) {
      closestTarget = {
        id: item.id,
        centerY,
        distance,
      };
    }
  }

  if (closestTarget) {
    return {
      id: closestTarget.id,
      centerY: closestTarget.centerY,
    };
  }

  return null;
}

function addExpandedDescendantsToDragItems<T extends TreeItem>({
  currentItems,
  flatItems,
  expandedParentId,
  excludedIds,
}: {
  currentItems: FlattenedItem<T>[];
  flatItems: FlattenedItem<T>[];
  expandedParentId: UniqueIdentifier;
  excludedIds: Set<UniqueIdentifier>;
}) {
  const existingIds = new Set(currentItems.map(({ id }) => id));
  const expandedParentIndex = flatItems.findIndex(({ id }) => id === expandedParentId);
  const dragParentIndex = currentItems.findIndex(({ id }) => id === expandedParentId);
  const expandedParent = flatItems[expandedParentIndex];

  if (!expandedParent || expandedParentIndex < 0 || dragParentIndex < 0) {
    return currentItems;
  }

  const descendantsToAdd: FlattenedItem<T>[] = [];
  const expandedCurrentItems = currentItems.map((item) =>
    item.id === expandedParentId ? { ...item, collapsed: false } : item,
  );

  for (const item of flatItems.slice(expandedParentIndex + 1)) {
    if (item.depth <= expandedParent.depth) {
      break;
    }

    if (existingIds.has(item.id) || excludedIds.has(item.id)) {
      continue;
    }

    descendantsToAdd.push(item);
  }

  if (descendantsToAdd.length === 0) {
    return expandedCurrentItems;
  }

  return [
    ...expandedCurrentItems.slice(0, dragParentIndex + 1),
    ...descendantsToAdd,
    ...expandedCurrentItems.slice(dragParentIndex + 1),
  ];
}

function PrivateSortableTree<T extends TreeItem = TreeItem>({
  items,
  setItems,
  isCollapsible,
  onLazyLoadChildren,
  showDropIndicator = false,
  autoExpandOnHoverDelay,
  indentationWidth = 50,
  isRemovable,
  onRemoveItem,
  allowNestedItemAddition,
  onAddItem,
  onDragEnd,
  onItemClick,
  renderItem,
  dragOverlayPortalContainer,
  dragActivationConstraints,
}: SortableTreeProps<T>) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [dragItems, setDragItems] = useState<FlattenedItem<T>[] | null>(null);
  const [projected, setProjected] = useState<ProjectedTreePosition | null>(null);
  const autoExpandTimeoutRef = useRef<number | null>(null);
  const initialDepthRef = useRef(0);
  const initialIndexRef = useRef(0);
  const projectedRef = useRef<ProjectedTreePosition | null>(null);
  const dragItemsRef = useRef<FlattenedItem<T>[] | null>(null);
  const sourceChildrenRef = useRef<FlattenedItem<T>[]>([]);
  const overIdRef = useRef<UniqueIdentifier | null>(null);
  const treeRef = useRef<HTMLDivElement | null>(null);

  const flatItems = useMemo(() => {
    return buildFlattenedItems(items);
  }, [items]);

  const childrenCountById = useMemo(() => {
    return getChildrenCountById(items);
  }, [items]);

  const flattenedItems = useMemo(() => {
    let flattenedTree = flatItems;

    // Disable dragging capabilities if there's just one item at root level.
    const rootItems = flattenedTree.filter(({ parentId }) => parentId == null);
    if (rootItems.length === 1) {
      flattenedTree = flattenedTree.map((item) =>
        item.id === rootItems[0].id
          ? {
              ...item,
              disableDragging: true,
            }
          : item,
      );
    }

    const collapsedItems = flattenedTree.reduce<UniqueIdentifier[]>((acc, { collapsed, id }) => {
      const hasChildren = (childrenCountById.get(id) ?? 0) > 0;
      if (collapsed && hasChildren) {
        acc.push(id);
      }
      return acc;
    }, []);

    return removeChildrenOf(flattenedTree, collapsedItems) as FlattenedItem<T>[];
  }, [childrenCountById, flatItems]);

  const renderedItems = dragItems ?? flattenedItems;
  const activeItem = activeId ? flatItems.find(({ id }) => id === activeId) : null;

  const pointerSensors = useMemo(() => {
    if (dragActivationConstraints === undefined) {
      return undefined;
    }

    return (defaultSensors: Sensors<DragDropManager>): Sensors<DragDropManager> => [
      ...defaultSensors.filter((sensor) => sensor !== PointerSensor),
      PointerSensor.configure({
        activationConstraints(event) {
          const constraint = getConstraintForPointerType(
            event.pointerType,
            dragActivationConstraints,
          );
          return toPointerActivationConstraints(constraint);
        },
      }),
    ];
  }, [dragActivationConstraints]);

  const setTreeItems = useCallback(
    (nextItems: TreeItems<T> | ((items: TreeItems<T>) => TreeItems<T>)) => {
      setItems((prevItems) => (typeof nextItems === 'function' ? nextItems(prevItems) : nextItems));
    },
    [setItems],
  );

  const setProjectedPosition = useCallback((nextProjected: ProjectedTreePosition | null) => {
    projectedRef.current = nextProjected;
    setProjected(nextProjected);
  }, []);

  const clearAutoExpandTimeout = useCallback(() => {
    if (autoExpandTimeoutRef.current !== null) {
      window.clearTimeout(autoExpandTimeoutRef.current);
      autoExpandTimeoutRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    clearAutoExpandTimeout();
    setActiveId(null);
    setDragItems(null);
    dragItemsRef.current = null;
    sourceChildrenRef.current = [];
    setProjectedPosition(null);
    overIdRef.current = null;

    document.body.style.setProperty('cursor', '');
  }, [clearAutoExpandTimeout, setProjectedPosition]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { source } = event.operation;

      if (!source) {
        return;
      }

      const activeItem = flattenedItems.find(({ id }) => id === source.id);

      if (!activeItem) {
        return;
      }

      initialDepthRef.current = activeItem.depth;
      initialIndexRef.current = flattenedItems.findIndex(({ id }) => id === source.id);
      const sourceDescendantIds = getDescendantIds(flatItems, [source.id]);
      const nextDragItems = flattenedItems.filter(({ id }) => !sourceDescendantIds.has(id));

      sourceChildrenRef.current = flatItems.filter(({ id }) => sourceDescendantIds.has(id));
      dragItemsRef.current = nextDragItems;
      overIdRef.current = source.id;
      setActiveId(source.id);
      setProjectedPosition({
        depth: activeItem.depth,
        parentId: activeItem.parentId,
      });
      setDragItems(nextDragItems);

      document.body.style.setProperty('cursor', 'grabbing');
    },
    [flatItems, flattenedItems, setProjectedPosition],
  );

  const updateDragItems = useCallback(
    ({
      sourceId,
      targetId,
      targetCenterY,
      manager,
      keyboardDepth,
    }: {
      sourceId: UniqueIdentifier;
      targetId?: UniqueIdentifier | null;
      targetCenterY?: number;
      manager: DragDropManager;
      keyboardDepth?: number;
    }) => {
      setDragItems((currentItems) => {
        const baseItems =
          currentItems ?? (removeChildrenOf(flattenedItems, [sourceId]) as FlattenedItem<T>[]);
        const isDraggingUp = manager.dragOperation.transform.y < 0;
        const dragPositionY = getDragPositionY(manager, isDraggingUp);
        const hasTarget = targetId != null && baseItems.some(({ id }) => id === targetId);
        const domTarget =
          !hasTarget || sourceId === targetId
            ? getTreeItemTargetAtY({
                items: baseItems,
                sourceId,
                y: dragPositionY,
                container: treeRef.current,
              })
            : null;
        const resolvedTargetId = domTarget?.id ?? targetId;

        if (resolvedTargetId == null || sourceId === resolvedTargetId) {
          return baseItems;
        }

        const targetIndex = baseItems.findIndex(({ id }) => id === resolvedTargetId);

        if (targetIndex < 0) {
          return baseItems;
        }

        const offsetLeft = manager.dragOperation.transform.x;
        const dragDepth = getDragDepth(offsetLeft, indentationWidth);
        const projectedDepth = keyboardDepth ?? initialDepthRef.current + dragDepth;
        const resolvedTargetCenterY = domTarget?.centerY ?? targetCenterY;
        const isBelowTarget =
          resolvedTargetCenterY != null &&
          dragPositionY >
            resolvedTargetCenterY + (isDraggingUp ? TREE_ITEM_DROP_EDGE_TOLERANCE : 0);
        const sortedItems = moveItemByTargetPosition(
          baseItems,
          sourceId,
          resolvedTargetId,
          isBelowTarget,
        );
        const nextProjected = getProjectionFromDepth(sortedItems, sourceId, projectedDepth);
        const nextItems = sortedItems.map((item) =>
          item.id === sourceId
            ? { ...item, depth: nextProjected.depth, parentId: nextProjected.parentId }
            : item,
        );

        setProjectedPosition(nextProjected);
        dragItemsRef.current = nextItems;

        return nextItems;
      });
    },
    [flattenedItems, indentationWidth, setProjectedPosition],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent, manager: DragDropManager) => {
      const { source, target } = event.operation;

      event.preventDefault();

      if (!source) {
        return;
      }

      overIdRef.current = target?.id ?? null;

      updateDragItems({
        sourceId: source.id,
        targetId: target?.id,
        targetCenterY: target?.shape?.center.y,
        manager,
      });
    },
    [updateDragItems],
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent, manager: DragDropManager) => {
      if (event.defaultPrevented) {
        return;
      }

      const { source, target } = event.operation;

      if (!source || !target) {
        return;
      }

      const currentItems = dragItems ?? flattenedItems;
      const currentItem = currentItems.find(({ id }) => id === source.id);
      const currentDepth = currentItem?.depth ?? 0;
      const keyboard = isKeyboardEvent(event.operation.activatorEvent);
      let keyboardDepth: number | undefined;

      if (keyboard) {
        const isHorizontal = event.by?.x !== 0 && event.by?.y === 0;

        if (isHorizontal) {
          event.preventDefault();
          keyboardDepth = currentDepth + Math.sign(event.by?.x ?? 0);
        }
      }

      const offsetLeft = manager.dragOperation.transform.x;
      const dragDepth = getDragDepth(offsetLeft, indentationWidth);
      const projectedDepth = keyboardDepth ?? initialDepthRef.current + dragDepth;
      const nextProjected = getProjectionFromDepth(currentItems, source.id, projectedDepth);

      if (keyboard && currentDepth !== nextProjected.depth) {
        const offset = indentationWidth * (nextProjected.depth - currentDepth);

        manager.actions.move({
          by: { x: offset, y: 0 },
          propagate: false,
        });
      }

      if (!keyboard) {
        updateDragItems({
          sourceId: source.id,
          targetId: target.id,
          targetCenterY: target.shape?.center.y,
          manager,
        });
        return;
      }

      if (
        currentItem &&
        (currentItem.depth !== nextProjected.depth ||
          currentItem.parentId !== nextProjected.parentId)
      ) {
        setProjectedPosition(nextProjected);
        setDragItems((items) =>
          (items ?? currentItems).map((item) =>
            item.id === source.id
              ? { ...item, depth: nextProjected.depth, parentId: nextProjected.parentId }
              : item,
          ),
        );
      }
    },
    [dragItems, flattenedItems, indentationWidth, setProjectedPosition, updateDragItems],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { source, target } = event.operation;
      const currentDragItems = dragItemsRef.current;
      const currentSourceChildren = sourceChildrenRef.current;
      const nextProjected = projectedRef.current;
      const overId = target?.id ?? overIdRef.current;

      resetState();

      if (event.canceled || !source) {
        return;
      }

      if (currentDragItems) {
        const activeTreeItem = currentDragItems.find(({ id }) => id === source.id);
        const originalTreeItem = flatItems.find(({ id }) => id === source.id);

        if (!activeTreeItem || !originalTreeItem) {
          return;
        }

        const activeIndex = currentDragItems.findIndex(({ id }) => id === source.id);
        const depthDelta = activeTreeItem.depth - originalTreeItem.depth;
        const sourceChildren = currentSourceChildren.map((item) => ({
          ...item,
          depth: item.depth + depthDelta,
        }));
        const sortedItems = [
          ...currentDragItems.slice(0, activeIndex + 1),
          ...sourceChildren,
          ...currentDragItems.slice(activeIndex + 1),
        ];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const newItems = sortedItems.map(({ depth, index, ...rest }) => rest) as TreeItems<T>;
        const result = getTreeItemMoveResult(newItems, activeTreeItem.id);

        setTreeItems(newItems);
        onDragEnd?.(result);
        return;
      }

      if (!overId || !nextProjected) {
        return;
      }

      const { depth, parentId } = nextProjected;
      const clonedItems: FlattenedItem[] = JSON.parse(JSON.stringify(flatItems));
      const overIndex = clonedItems.findIndex(({ id }) => id === overId);
      const activeIndex = clonedItems.findIndex(({ id }) => id === source.id);
      const activeTreeItem = clonedItems[activeIndex];

      if (!activeTreeItem || activeIndex < 0 || overIndex < 0) {
        return;
      }

      clonedItems[activeIndex] = { ...activeTreeItem, depth, parentId };

      const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const newItems = sortedItems.map(({ depth, index, ...rest }) => rest) as TreeItems<T>;
      const result = getTreeItemMoveResult(newItems, clonedItems[activeIndex].id);

      setTreeItems(newItems);
      onDragEnd?.(result);
    },
    [flatItems, onDragEnd, resetState, setTreeItems],
  );

  const handleRemove = useCallback(
    (id: UniqueIdentifier) => {
      setTreeItems((items) => removeItemById(items, id));
    },
    [setTreeItems],
  );

  const setCollapsedState = useCallback(
    (id: UniqueIdentifier, collapsed: boolean) => {
      return setTreeItems((items) =>
        setTreeItemProperties(items, id, () => {
          return { collapsed } as Partial<T>;
        }),
      );
    },
    [setTreeItems],
  );

  const expandItem = useCallback(
    ({
      id,
      canFetchChildren,
      collapsed,
    }: {
      id: UniqueIdentifier;
      canFetchChildren: TreeItem['canFetchChildren'];
      collapsed: TreeItem['collapsed'];
    }) => {
      if (!collapsed) {
        return;
      }

      if (canFetchChildren) {
        return onLazyLoadChildren?.(id, true);
      }

      return setCollapsedState(id, false);
    },
    [onLazyLoadChildren, setCollapsedState],
  );

  const handleCollapse = useCallback(
    ({
      id,
      canFetchChildren,
      collapsed,
    }: {
      id: UniqueIdentifier;
      canFetchChildren: TreeItem['canFetchChildren'];
      collapsed: TreeItem['collapsed'];
    }) => {
      if (collapsed) {
        return expandItem({ id, canFetchChildren, collapsed });
      }

      if (canFetchChildren) {
        return onLazyLoadChildren?.(id, false);
      }

      return setCollapsedState(id, true);
    },
    [expandItem, onLazyLoadChildren, setCollapsedState],
  );

  useEffect(() => {
    clearAutoExpandTimeout();

    const autoExpandTargetId = projected?.parentId;

    if (autoExpandOnHoverDelay == null || !activeId || !autoExpandTargetId) {
      return;
    }

    const targetItem = flatItems.find((item) => item.id === autoExpandTargetId);

    if (!targetItem?.collapsed) {
      return;
    }

    const hasChildren = (childrenCountById.get(autoExpandTargetId) ?? 0) > 0;
    const canExpand = hasChildren || Boolean(targetItem.canFetchChildren);

    if (!canExpand) {
      return;
    }

    autoExpandTimeoutRef.current = window.setTimeout(() => {
      expandItem({
        id: targetItem.id,
        canFetchChildren: targetItem.canFetchChildren,
        collapsed: targetItem.collapsed,
      });

      const currentDragItems = dragItemsRef.current;

      if (activeId && currentDragItems) {
        const nextDragItems = addExpandedDescendantsToDragItems({
          currentItems: currentDragItems,
          flatItems,
          expandedParentId: targetItem.id,
          excludedIds: getDescendantIds(flatItems, [activeId]),
        });

        dragItemsRef.current = nextDragItems;
        setDragItems(nextDragItems);
      }

      autoExpandTimeoutRef.current = null;
    }, autoExpandOnHoverDelay);

    return clearAutoExpandTimeout;
  }, [
    activeId,
    autoExpandOnHoverDelay,
    childrenCountById,
    clearAutoExpandTimeout,
    expandItem,
    flatItems,
    projected,
  ]);

  useEffect(() => {
    return clearAutoExpandTimeout;
  }, [clearAutoExpandTimeout]);

  return (
    <div ref={treeRef} role="tree">
      <DragDropProvider
        sensors={pointerSensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {renderedItems.map((item, index) => {
          const { id, collapsed, depth, canFetchChildren, disableDragging } = item;
          const hasChildren = (childrenCountById.get(id) ?? 0) > 0;
          const canCollapse = hasChildren || Boolean(canFetchChildren);

          return (
            <SortableTreeItem<T>
              key={id}
              id={id}
              index={index}
              value={item}
              disableDragging={Boolean(disableDragging)}
              depth={id === activeId && projected ? projected.depth : depth}
              indentationWidth={indentationWidth}
              indicator={showDropIndicator}
              collapsed={Boolean(collapsed && canCollapse)}
              onCollapse={
                isCollapsible && canCollapse
                  ? () => handleCollapse({ id, canFetchChildren, collapsed })
                  : undefined
              }
              onRemove={
                isRemovable ? () => (onRemoveItem ? onRemoveItem(id) : handleRemove(id)) : undefined
              }
              onAdd={allowNestedItemAddition ? () => onAddItem?.(id) : undefined}
              onLabelClick={onItemClick ? () => onItemClick(id) : undefined}
              renderItem={renderItem}
            />
          );
        })}
        {createPortal(
          <DragOverlay dropAnimation={null} style={{ width: 'min-content' }}>
            {() =>
              activeId && activeItem ? (
                <TreeItemComponent<T>
                  depth={activeItem.depth}
                  clone
                  childCount={getChildCount(items, activeId) + 1}
                  value={activeItem}
                  indentationWidth={indentationWidth}
                  wrapperRef={() => {}}
                  renderItem={renderItem}
                />
              ) : null
            }
          </DragOverlay>,
          dragOverlayPortalContainer ?? document.body,
        )}
      </DragDropProvider>
    </div>
  );
}

export const SortableTree = <T extends TreeItem = TreeItem>(props: SortableTreeProps<T>) => {
  return <PrivateSortableTree {...props} />;
};
