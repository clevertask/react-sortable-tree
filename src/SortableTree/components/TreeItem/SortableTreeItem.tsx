import { CSSProperties, memo, useCallback } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/abstract';
import { useSortable } from '@dnd-kit/react/sortable';

import { TreeItem, Props as TreeItemProps } from './TreeItem';
import type { TreeItem as TTreeItem } from '../../types';
import { iOS } from '../../utilities';

interface Props<T extends TTreeItem = TTreeItem> extends Omit<
  TreeItemProps<T>,
  'handleProps' | 'wrapperRef'
> {
  id: UniqueIdentifier;
  index: number;
}

const sortableConfig = {
  alignment: {
    x: 'start',
    y: 'center',
  },
  transition: {
    idle: true,
  },
} as const;

function PrivateSortableTreeItem<T extends TTreeItem = TTreeItem>({
  id,
  index,
  depth,
  ...props
}: Props<T>) {
  const { isDragging, handleRef, ref } = useSortable({
    ...sortableConfig,
    id,
    index,
    data: {
      depth,
      parentId: props.value.parentId,
    },
    disabled: props.disableDragging ? { draggable: true } : false,
  });
  const style: CSSProperties = {};
  const noopRef = useCallback(() => {}, []);

  return (
    <TreeItem
      {...props}
      ref={ref}
      wrapperRef={noopRef}
      style={style}
      depth={depth}
      ghost={isDragging}
      disableSelection={iOS}
      disableInteraction={isDragging}
      handleProps={
        props.disableDragging
          ? undefined
          : {
              ref: handleRef,
            }
      }
    />
  );
}

export const SortableTreeItem = memo(PrivateSortableTreeItem) as typeof PrivateSortableTreeItem;
