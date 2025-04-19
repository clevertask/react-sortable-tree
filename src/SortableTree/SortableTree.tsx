import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Announcements,
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverlay,
  DragMoveEvent,
  DragEndEvent,
  DragOverEvent,
  MeasuringStrategy,
  DropAnimation,
  Modifier,
  defaultDropAnimation,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';

import {
  buildTree,
  flattenTree,
  getProjection,
  getChildCount,
  removeItemById,
  removeChildrenOf,
  setTreeItemProperties,
} from './utilities';
import type {
  DropResult,
  FlattenedItem,
  SensorContext,
  SortableTreeProps,
  TreeItem,
  TreeItems,
} from './types';
import { sortableTreeKeyboardCoordinates } from './keyboardCoordinates';
import { SortableTreeItem } from './components';
import { CSS } from '@dnd-kit/utilities';

const measuring = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

const dropAnimationConfig: DropAnimation = {
  keyframes({ transform }) {
    return [
      { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
      {
        opacity: 0,
        transform: CSS.Transform.toString({
          ...transform.final,
          x: transform.final.x + 5,
          y: transform.final.y + 5,
        }),
      },
    ];
  },
  easing: 'ease-out',
  sideEffects({ active }) {
    active.node.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: defaultDropAnimation.duration,
      easing: defaultDropAnimation.easing,
    });
  },
};

function PrivateSortableTree<T extends TreeItem = TreeItem>({
  items,
  setItems,
  isCollapsible,
  onLazyLoadChildren,
  showDropIndicator = false,
  indentationWidth = 50,
  isRemovable,
  onRemoveItem,
  allowNestedItemAddition,
  onAddItem,
  onDragEnd,
  onItemClick,
  renderItem,
}: SortableTreeProps<T>) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<{
    parentId: UniqueIdentifier | null;
    overId: UniqueIdentifier;
  } | null>(null);

  const flattenedItems = useMemo(() => {
    let flattenedTree = flattenTree(items);

    // Disable dragging capabilities if there's just one item at root level
    const rootItems = flattenedTree.filter(({ parentId }) => !parentId);
    if (rootItems.length === 1) {
      flattenedTree = flattenedTree.map((item) =>
        item.id === rootItems[0].id ?
          {
            ...item,
            disableDragging: true,
          }
        : item,
      );
    }

    const collapsedItems = flattenedTree.reduce<UniqueIdentifier[]>(
      (acc, { children, collapsed, id }) => {
        if (collapsed && children.length) {
          acc.push(id);
        }
        return acc;
      },
      [],
    );

    return removeChildrenOf(
      flattenedTree,
      activeId ? [activeId, ...collapsedItems] : collapsedItems,
    );
  }, [activeId, items]);

  const projected =
    activeId && overId ?
      getProjection(flattenedItems, activeId, overId, offsetLeft, indentationWidth)
    : null;

  const sensorContext: SensorContext = useRef({
    items: flattenedItems,
    offset: offsetLeft,
  });

  const [coordinateGetter] = useState(() =>
    sortableTreeKeyboardCoordinates(sensorContext, showDropIndicator, indentationWidth),
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter,
    }),
  );

  const sortedIds = useMemo(() => flattenedItems.map(({ id }) => id), [flattenedItems]);

  const activeItem = activeId ? flattenedItems.find(({ id }) => id === activeId) : null;

  useEffect(() => {
    sensorContext.current = {
      items: flattenedItems,
      offset: offsetLeft,
    };
  }, [flattenedItems, offsetLeft]);

  const handleDragStart = useCallback(
    ({ active: { id: activeId } }: DragStartEvent) => {
      setActiveId(activeId);
      setOverId(activeId);

      const activeItem = flattenedItems.find(({ id }) => id === activeId);

      if (activeItem) {
        setCurrentPosition({
          parentId: activeItem.parentId,
          overId: activeId,
        });
      }

      document.body.style.setProperty('cursor', 'grabbing');
    },
    [flattenedItems],
  );

  const handleDragMove = useCallback(({ delta }: DragMoveEvent) => {
    setOffsetLeft(delta.x);
  }, []);

  const handleDragOver = useCallback(({ over }: DragOverEvent) => {
    setOverId(over?.id ?? null);
  }, []);

  const resetState = useCallback(() => {
    setOverId(null);
    setActiveId(null);
    setOffsetLeft(0);
    setCurrentPosition(null);

    document.body.style.setProperty('cursor', '');
  }, []);

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      resetState();

      if (projected && over) {
        const { depth, parentId } = projected;
        const clonedItems: FlattenedItem[] = JSON.parse(JSON.stringify(flattenTree(items)));
        const overIndex = clonedItems.findIndex(({ id }) => id === over.id);
        const activeIndex = clonedItems.findIndex(({ id }) => id === active.id);
        const activeTreeItem = clonedItems[activeIndex];

        clonedItems[activeIndex] = { ...activeTreeItem, depth, parentId };

        const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);
        const newItems = buildTree(sortedItems);
        const result = findItemActualIndex(newItems, clonedItems[activeIndex].id, parentId);

        setItems(newItems as TreeItems<T>);
        onDragEnd?.(result);
      }
    },
    [items, projected, onDragEnd, resetState, setItems],
  );

  const handleDragCancel = useCallback(() => {
    resetState();
  }, [resetState]);

  const handleRemove = useCallback(
    (id: UniqueIdentifier) => {
      setItems((items) => removeItemById(items, id));
    },
    [setItems],
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
      if (canFetchChildren) {
        return onLazyLoadChildren?.(id, Boolean(collapsed));
      }

      return setItems((items) =>
        setTreeItemProperties(items, id, (item) => {
          return { collapsed: !item.collapsed } as T;
        }),
      );
    },
    [onLazyLoadChildren, setItems],
  );

  const getMovementAnnouncement = useCallback(
    (eventName: string, activeId: UniqueIdentifier, overId?: UniqueIdentifier) => {
      if (overId && projected) {
        if (eventName !== 'onDragEnd') {
          if (
            currentPosition &&
            projected.parentId === currentPosition.parentId &&
            overId === currentPosition.overId
          ) {
            return;
          } else {
            setCurrentPosition({
              parentId: projected.parentId,
              overId,
            });
          }
        }

        const clonedItems: FlattenedItem[] = JSON.parse(JSON.stringify(flattenTree(items)));
        const overIndex = clonedItems.findIndex(({ id }) => id === overId);
        const activeIndex = clonedItems.findIndex(({ id }) => id === activeId);
        const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);

        const previousItem = sortedItems[overIndex - 1];

        let announcement;
        const movedVerb = eventName === 'onDragEnd' ? 'dropped' : 'moved';
        const nestedVerb = eventName === 'onDragEnd' ? 'dropped' : 'nested';

        if (!previousItem) {
          const nextItem = sortedItems[overIndex + 1];
          announcement = `${activeId} was ${movedVerb} before ${nextItem.id}.`;
        } else {
          if (projected.depth > previousItem.depth) {
            announcement = `${activeId} was ${nestedVerb} under ${previousItem.id}.`;
          } else {
            let previousSibling: FlattenedItem | undefined = previousItem;
            while (previousSibling && projected.depth < previousSibling.depth) {
              const parentId: UniqueIdentifier | null = previousSibling.parentId;
              previousSibling = sortedItems.find(({ id }) => id === parentId);
            }

            if (previousSibling) {
              announcement = `${activeId} was ${movedVerb} after ${previousSibling.id}.`;
            }
          }
        }

        return announcement;
      }

      return;
    },
    [currentPosition, items, projected],
  );

  const announcements: Announcements = {
    onDragStart({ active }) {
      return `Picked up ${active.id}.`;
    },
    onDragMove({ active, over }) {
      return getMovementAnnouncement('onDragMove', active.id, over?.id);
    },
    onDragOver({ active, over }) {
      return getMovementAnnouncement('onDragOver', active.id, over?.id);
    },
    onDragEnd({ active, over }) {
      return getMovementAnnouncement('onDragEnd', active.id, over?.id);
    },
    onDragCancel({ active }) {
      return `Moving was cancelled. ${active.id} was dropped in its original position.`;
    },
  };

  return (
    <DndContext
      accessibility={{ announcements }}
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuring}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
        {flattenedItems.map((item) => {
          const { id, children, collapsed, depth, canFetchChildren, disableDragging } = item;
          return (
            <SortableTreeItem
              key={id}
              id={id}
              value={item}
              disableDragging={Boolean(disableDragging)}
              depth={id === activeId && projected ? projected.depth : depth}
              indentationWidth={indentationWidth}
              indicator={showDropIndicator}
              collapsed={Boolean(collapsed && (children.length || canFetchChildren))}
              onCollapse={
                isCollapsible && (children.length || canFetchChildren) ?
                  () => handleCollapse({ id, canFetchChildren, collapsed })
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
          <DragOverlay
            dropAnimation={dropAnimationConfig}
            modifiers={showDropIndicator ? [adjustTranslate] : undefined}
          >
            {activeId && activeItem ?
              <SortableTreeItem
                id={activeId}
                depth={activeItem.depth}
                clone
                childCount={getChildCount(items, activeId) + 1}
                value={activeItem}
                indentationWidth={indentationWidth}
                renderItem={renderItem}
              />
            : null}
          </DragOverlay>,
          document.body,
        )}
      </SortableContext>
    </DndContext>
  );
}

const adjustTranslate: Modifier = ({ transform }) => {
  return {
    ...transform,
    y: transform.y - 25,
  };
};

function findItemActualIndex(
  items: TreeItems,
  targetId: UniqueIdentifier,
  parent: UniqueIdentifier | null = null,
): DropResult | null {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.id === targetId) {
      return { index: i, parent, movedItem: item };
    }
    if (item.children && item.children.length > 0) {
      const result = findItemActualIndex(item.children, targetId, item.id);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

export const SortableTree = <T extends TreeItem = TreeItem>(props: SortableTreeProps<T>) => {
  return <PrivateSortableTree {...props} />;
};
