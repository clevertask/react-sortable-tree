import React, { createContext } from 'react';
import type { TreeItem, UniqueIdentifier } from '../../types';
import type { RenderItemProps } from '../TreeItem/TreeItem';

type AriaProps = {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
};

export type TreeItemStructureProps = {
  treeItem: TreeItem & { parentId?: UniqueIdentifier | null };
  dropZoneRef: (element: HTMLElement | null) => void;
  draggableItemRef: React.Ref<Element>;
  dropZoneStyle?: React.CSSProperties;
  draggableItemStyle?: React.CSSProperties;
  classNames?: {
    dropZone?: string;
    draggableItem?: string;
  };
  asDropZone?: React.ElementType;
  asDraggableItem?: React.ElementType;
  children?: React.ReactNode;
  clone?: boolean;
  dataSlots: {
    dropZone?: AriaProps & Record<string, string | boolean | number | undefined>;
    draggableItem?: AriaProps & Record<string, string>;
  };
} & Pick<RenderItemProps, 'dragListeners'>;

const DragContext = createContext<{
  dragListeners?: RenderItemProps['dragListeners'];
  label?: string;
} | null>(null);

export const TreeItemStructure = ({
  dropZoneRef,
  draggableItemRef,
  dropZoneStyle,
  draggableItemStyle,
  classNames = {},
  asDropZone: DropZoneComponent = 'div',
  asDraggableItem: DraggableComponent = 'div',
  children,
  dataSlots,
  treeItem,
  clone,
  dragListeners,
}: TreeItemStructureProps) => {
  const dropZoneAria = clone
    ? null
    : {
        role: 'treeitem',
        'aria-label': treeItem.label,
        ...dataSlots.dropZone,
      };

  return (
    <DropZoneComponent
      className={classNames.dropZone}
      style={dropZoneStyle}
      {...dropZoneAria}
      {...(treeItem.parentId ? { 'data-tree-item-parent-id': treeItem.parentId } : null)}
      data-tree-item-id={treeItem.id}
      ref={dropZoneRef}
    >
      <DragContext.Provider
        value={{
          dragListeners: dragListeners,
          label: treeItem.label,
        }}
      >
        <DraggableComponent
          className={classNames.draggableItem}
          style={draggableItemStyle}
          {...dataSlots.draggableItem}
          ref={draggableItemRef}
          data-tree-draggable
        >
          {children}
        </DraggableComponent>
      </DragContext.Provider>
    </DropZoneComponent>
  );
};

TreeItemStructure.DragHandler = function DragHandler({
  children,
  as: Component = 'div',
  className,
  style,
}: {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ctx = React.useContext(DragContext);

  if (!ctx) {
    if (import.meta.env.DEV) {
      throw new Error('TreeItemStructure.DragHandler must be used inside TreeItemStructure');
    }
    return null;
  }

  return (
    <Component
      {...ctx.dragListeners}
      aria-label={`Drag ${ctx.label}`}
      className={className}
      style={{ display: 'inherit', ...(style || null) }}
      data-tree-drag-handle
    >
      {children}
    </Component>
  );
};
