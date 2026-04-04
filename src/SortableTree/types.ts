import type { MutableRefObject } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { Props } from './components/TreeItem/TreeItem';

/**
 * Represents a flat item in the tree structure.
 */
export type BaseTreeItem = {
  /**
   * Unique identifier for the item. Can be a string or number.
   */
  id: UniqueIdentifier;

  /**
   * The text label displayed for the item in the tree.
   */
  label: string;

  /**
   * The parent id for this item. Use null for root items.
   */
  parentId: UniqueIdentifier | null;

  /**
   * Determines whether the item's children are initially collapsed.
   * @default false
   */
  collapsed?: boolean;

  /**
   * Indicates whether this item can lazy-load its children.
   * When true, children will be fetched on expansion if the children array is empty.
   * This is useful for optimizing initial render performance with large trees.
   * @default false
   */
  canFetchChildren?: boolean;

  /**
   * When true, prevents this item from being dragged.
   * Useful for creating fixed or header items in the tree.
   * @default false
   */
  disableDragging?: boolean;
};

export type TreeItem<ExtraProps = unknown> = BaseTreeItem & ExtraProps;
export type TreeItems<ExtraProps = unknown> = TreeItem<ExtraProps>[];

/**
 * Represents a nested item (legacy or internal) that includes children.
 */
export type TreeItemWithChildren<ExtraProps = unknown> = Omit<TreeItem<ExtraProps>, 'parentId'> & {
  /**
   * The parent id for this item. Legacy items may omit it.
   */
  parentId?: UniqueIdentifier | null;

  /**
   * An array of child items. If empty, the item is a leaf node.
   */
  children: TreeItemWithChildren<ExtraProps>[];
};

export type TreeItemsWithChildren<ExtraProps = unknown> = TreeItemWithChildren<ExtraProps>[];

export type FlattenedItem<ExtraProps = unknown> = {
  depth: number;
  index: number;
} & TreeItem<ExtraProps>;

export type SensorContext = MutableRefObject<{
  items: FlattenedItem[];
  offset: number;
}>;

/**
 * Props for the SortableTree component.
 */
export interface SortableTreeProps<T extends TreeItem = TreeItem> {
  /**
   * A control that lets you add the indentation width for children elements
   */
  indentationWidth?: number;

  /**
   * The flat array of items to be rendered.
   */
  items: TreeItems<T>;

  /**
   * Callback function called when the tree structure changes.
   * @param items - The updated flat array of tree items.
   */
  setItems: React.Dispatch<React.SetStateAction<TreeItems<T>>>;

  /**
   * Determines if tree items can be collapsed/expanded.
   * @default false
   */
  isCollapsible?: boolean;

  /**
   * Callback function for lazy loading child items when a parent is expanded.
   * It only works if the item has the `canFetchChildren` property
   * @param id - The id of the parent item being expanded.
   * @param isExpanding - True if the item is being expanded, false if collapsing.
   */
  onLazyLoadChildren?: (id: UniqueIdentifier, isExpanding: boolean) => void;

  /**
   * Determines if a drop indicator should be shown when dragging items.
   * @default false
   */
  showDropIndicator?: boolean;

  /**
   * When provided, automatically expands a collapsed item after it has been hovered
   * for the given amount of time during a drag operation.
   */
  autoExpandOnHoverDelay?: number;

  /**
   * Determines if items can be removed from the tree.
   * @default false
   */
  isRemovable?: boolean;

  /**
   * Callback function called when an item is removed from the tree.
   * @param id - The id of the item being removed.
   */
  onRemoveItem?: (id: UniqueIdentifier) => void;

  /**
   * Determines if new items can be added as children to existing items.
   * @default false
   */
  allowNestedItemAddition?: boolean;

  /**
   * Callback function called when a new item is added to the tree.
   * @param parentId - The id of the parent item, or null if adding a root item.
   */
  onAddItem?: (parentId: UniqueIdentifier | null) => void;

  /**
   * Callback function called when a drag operation ends.
   * @param result - An object containing information about the drag operation.
   */
  onDragEnd?: (result: DropResult<T>) => void;

  /**
   * Callback function called when an item in the tree is clicked.
   * @param id - The id of the clicked item.
   */
  onItemClick?: (id: UniqueIdentifier) => void;

  /**
   * You can place a react component next to the item's label. This is temporal while we
   * figure out a way of rendering a whole custom item
   * @param item
   * @returns
   */
  renderItem?: Props<T>['renderItem'];
}

/**
 * Represents the result of a drag operation in the tree.
 */
export type DropResult<T extends TreeItem = TreeItem> = {
  /**
   * The item that was dragged.
   */
  movedItem: T;

  /**
   * The new parent of the dragged item, or null if it's now a root item.
   */
  parent: UniqueIdentifier | null;

  /**
   * The new index of the dragged item within its parent's children array.
   */
  index: number;

  /**
   * The id of the previous sibling in the new position, or null when the item is first.
   */
  beforeItemId?: UniqueIdentifier | null;

  /**
   * The id of the next sibling in the new position, or null when the item is last.
   */
  afterItemId?: UniqueIdentifier | null;
} | null;

export type MoveTreeItemResult<T extends TreeItem = TreeItem> = {
  items: TreeItems<T>;
  result: DropResult<T>;
};

export type MoveTreeItemsOverlapBehavior = 'preserve-subtrees' | 'extract-selected-descendants';

export type MoveTreeItemsOptions = {
  /**
   * Controls how overlapping selections are handled.
   * - preserve-subtrees: descendants of selected parents are ignored as separate move roots
   * - extract-selected-descendants: explicitly selected descendants are detached and moved too
   * @default 'preserve-subtrees'
   */
  overlapBehavior?: MoveTreeItemsOverlapBehavior;
};

export type MoveTreeItemsResult<T extends TreeItem = TreeItem> = {
  items: TreeItems<T>;
  results: DropResult<T>[];
  movedItemIds: UniqueIdentifier[];
};

export type { UniqueIdentifier } from '@dnd-kit/core';
