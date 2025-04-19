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
  draggableItemProps?: Record<string, any>;
  children?: React.ReactNode;
  dataSlots: {
    dropZone: Record<string, string | boolean | undefined>;
    draggableItem: Record<string, string>;
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
  draggableItemProps,
  children,
  dataSlots,
}: TreeItemStructureProps) => {
  return (
    <DropZoneComponent
      ref={dropZoneRef}
      className={classNames.dropZone}
      style={dropZoneStyle}
      {...dataSlots.dropZone}
    >
      {children ?
        <DraggableComponent
          ref={draggableItemRef}
          className={classNames.draggableItem}
          style={draggableItemStyle}
          {...dataSlots.draggableItem}
        >
          {children}
        </DraggableComponent>
      : <DraggableComponent
          ref={draggableItemRef}
          className={classNames.draggableItem}
          {...draggableItemProps}
        />
      }
    </DropZoneComponent>
  );
};
