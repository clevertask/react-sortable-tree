import { TreeItem } from '../../types';

type AriaProps = {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
};

export interface TreeItemStructureProps {
  treeItem: TreeItem;
  dropZoneRef: (element: HTMLElement | null) => void;
  draggableItemRef: React.Ref<any>;
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
}

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
}: TreeItemStructureProps) => {
  return (
    <DropZoneComponent
      data-tree-item-parent-id={treeItem.parentId}
      className={classNames.dropZone}
      style={dropZoneStyle}
      {...(clone ? null : { ...dataSlots.dropZone, role: 'treeitem' })}
      ref={dropZoneRef}
    >
      <DraggableComponent
        className={classNames.draggableItem}
        style={draggableItemStyle}
        {...dataSlots.draggableItem}
        ref={draggableItemRef}
      >
        {children}
      </DraggableComponent>
    </DropZoneComponent>
  );
};
