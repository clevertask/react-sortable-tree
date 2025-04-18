import React, { forwardRef, HTMLAttributes, memo } from 'react';
import styles from './TreeItem.module.css';
import classNames from 'classnames';
import { Action } from '../Action';
import { Handle } from '../Handle';
import { Remove } from '../Remove';
import { Add } from '../Add';
import { TreeItemStructureProps } from '../TreeItemStructure';
import { TreeItem as TTreeItem } from '../../types';

export interface RenderItemProps<T extends TTreeItem = TTreeItem>
  extends Pick<
      TreeItemStructureProps,
      'classNames' | 'layoutStyle' | 'dropZoneRef' | 'draggableItemRef'
    >,
    Pick<
      Props,
      | 'onCollapse'
      | 'childCount'
      | 'clone'
      | 'ghost'
      | 'indicator'
      | 'disableSelection'
      | 'disableInteraction'
      | 'collapsed'
    > {
  dragListeners?: any;
  treeItem: T;
  dataSlots: {
    dropZone: Record<string, boolean | undefined>;
    draggableItem: Record<string, string>;
  };
}

export interface Props<T extends TTreeItem = TTreeItem>
  extends Omit<HTMLAttributes<HTMLLIElement>, 'id'> {
  childCount?: number;
  clone?: boolean;
  collapsed?: boolean;
  depth: number;
  disableInteraction?: boolean;
  disableSelection?: boolean;
  disableDragging?: boolean;
  ghost?: boolean;
  handleProps?: any;
  indicator?: boolean;
  indentationWidth: number;
  value: T;
  onCollapse?(): void;
  onRemove?(): void;
  onAdd?(): void;
  onLabelClick?(): void;
  wrapperRef: RenderItemProps<T>['dropZoneRef'];
  renderItem?: (props: RenderItemProps<T>) => React.ReactNode;
}

export const _TreeItem = forwardRef<HTMLDivElement, Props>(
  (
    {
      childCount,
      clone,
      depth,
      disableSelection,
      disableInteraction,
      disableDragging,
      ghost,
      handleProps,
      indentationWidth,
      indicator,
      collapsed,
      onCollapse,
      onRemove,
      onAdd,
      onLabelClick,
      style,
      value,
      wrapperRef,
      renderItem,
      ...props
    },
    ref,
  ) => {
    return renderItem ?
        renderItem({
          dropZoneRef: wrapperRef,
          draggableItemRef: ref,
          treeItem: value,
          dataSlots: {
            dropZone: {
              'data-clone': clone,
              'data-ghost': ghost,
              'data-indicator': indicator,
              'data-disable-interaction': disableInteraction,
              'data-disable-selection': disableSelection,
            },
            draggableItem: {
              'data-slot': 'draggableItem',
            },
          },
          layoutStyle: {
            paddingLeft: `${indentationWidth * depth}px`,
            ...style,
          },
          dragListeners: handleProps,
          onCollapse,
          childCount,
          clone,
          ghost,
          indicator,
          disableSelection,
          disableInteraction,
          collapsed,
        })
      : <li
          className={classNames(
            styles.Wrapper,
            clone && styles.clone,
            ghost && styles.ghost,
            indicator && styles.indicator,
            disableSelection && styles.disableSelection,
            disableInteraction && styles.disableInteraction,
          )}
          ref={wrapperRef}
          style={
            {
              '--spacing': `${indentationWidth * depth}px`,
            } as React.CSSProperties
          }
          {...props}
        >
          <div className={styles.TreeItem} ref={ref} style={style}>
            {!disableDragging && <Handle {...handleProps} />}
            {onCollapse && (
              <Action
                onClick={onCollapse}
                className={classNames(styles.Collapse, collapsed && styles.collapsed)}
              >
                {collapseIcon}
              </Action>
            )}
            <span onClick={onLabelClick} className={styles.Text}>
              {value.label}
            </span>
            {!clone && onRemove && <Remove onClick={onRemove} />}
            {!clone && onAdd && <Add onClick={onAdd} />}
            {clone && childCount && childCount > 1 ?
              <span className={styles.Count}>{childCount}</span>
            : null}
          </div>
        </li>;
  },
);

const collapseIcon = (
  <svg width="10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 41">
    <path d="M30.76 39.2402C31.885 40.3638 33.41 40.995 35 40.995C36.59 40.995 38.115 40.3638 39.24 39.2402L68.24 10.2402C69.2998 9.10284 69.8768 7.59846 69.8494 6.04406C69.822 4.48965 69.1923 3.00657 68.093 1.90726C66.9937 0.807959 65.5106 0.178263 63.9562 0.150837C62.4018 0.123411 60.8974 0.700397 59.76 1.76024L35 26.5102L10.24 1.76024C9.10259 0.700397 7.59822 0.123411 6.04381 0.150837C4.4894 0.178263 3.00632 0.807959 1.90702 1.90726C0.807714 3.00657 0.178019 4.48965 0.150593 6.04406C0.123167 7.59846 0.700153 9.10284 1.75999 10.2402L30.76 39.2402Z" />
  </svg>
);

export const TreeItem = memo(_TreeItem);
