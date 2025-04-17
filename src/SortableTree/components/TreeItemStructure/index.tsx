export interface TreeItemStructureProps {
  dropZoneRef: (element: HTMLElement | null) => void;
  draggableItemRef: React.Ref<any>;
  layoutStyle?: React.CSSProperties;
  classNames?: {
    dropZone?: string;
    draggableItem?: string;
  };
  asDropZone?: React.ElementType;
  asDraggableItem?: React.ElementType;
  draggableItemProps?: Record<string, any>;
  children?: React.ReactNode;
}

export const TreeItemStructure = ({
  dropZoneRef,
  draggableItemRef,
  layoutStyle,
  classNames = {},
  asDropZone: DropZoneComponent = 'div',
  asDraggableItem: DraggableComponent = 'div',
  draggableItemProps,
  children,
}: TreeItemStructureProps) => {
  return (
    <DropZoneComponent ref={dropZoneRef} className={classNames.dropZone} style={layoutStyle}>
      {children ?
        <DraggableComponent ref={draggableItemRef} className={classNames.draggableItem}>
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
