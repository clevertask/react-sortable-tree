type AriaProps = {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
};

export interface TreeItemStructureProps {
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
}: TreeItemStructureProps) => {
  return (
    <DropZoneComponent
      className={classNames.dropZone}
      style={dropZoneStyle}
      {...dataSlots.dropZone}
      ref={dropZoneRef}
      role="region"
      aria-roledescription="drop zone"
    >
      <DraggableComponent
        className={classNames.draggableItem}
        style={draggableItemStyle}
        {...dataSlots.draggableItem}
        role="treeitem"
        ref={draggableItemRef}
      >
        {children}
      </DraggableComponent>
    </DropZoneComponent>
  );
};
