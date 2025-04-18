import clsNames from 'classnames';
import { RenderItemProps } from '../TreeItem/TreeItem';

export interface TreeItemStructureProps extends Pick<RenderItemProps, 'dataSlots'> {
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
  dataSlots,
}: TreeItemStructureProps) => {
  return (
    <DropZoneComponent
      ref={dropZoneRef}
      className={classNames.dropZone}
      style={layoutStyle}
      {...dataSlots.dropZone}
    >
      {children ?
        <DraggableComponent
          ref={draggableItemRef}
          className={classNames.draggableItem}
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
