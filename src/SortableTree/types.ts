import type {MutableRefObject} from 'react';
import type {UniqueIdentifier} from '@dnd-kit/core';

export interface OptimizedTreeStructure {
  items: TreeItems;
  itemMap: Map<UniqueIdentifier, TreeItem>;
}

/**
 * Represents an item in the tree structure.
 */
export type TreeItem = {
  /**
   * Unique identifier for the item. Can be a string or number.
   */
  id: UniqueIdentifier;

  /**
   * The text label displayed for the item in the tree.
   */
  label: string;

  /**
   * An array of child TreeItems. If empty, the item is a leaf node.
   */
  children: TreeItem[];

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

  /**
   * Any additional custom properties can be added here.
   */
  [key: string]: any;
};

export type TreeItems = TreeItem[];

export interface FlattenedItem extends TreeItem {
  parentId: UniqueIdentifier | null;
  depth: number;
  index: number;
}

export type SensorContext = MutableRefObject<{
  items: FlattenedItem[];
  offset: number;
}>;

/**
 * Props for the SortableTree component.
 */
export interface SortableTreeProps {
  /**
   * A control that lets you add the indentation width for children elements
   */
  indentationWidth?: number;

  /**
   * The array of tree items to be rendered.
   */
  items: TreeItems;

  /**
   * Callback function called when the tree structure changes.
   * @param items - The updated array of tree items.
   */
  onItemsChange: React.Dispatch<React.SetStateAction<OptimizedTreeStructure>>;

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
  onLazyLoadChildren?: (
    id: UniqueIdentifier,
    isExpanding: boolean
  ) => Promise<void>;

  /**
   * Determines if a drop indicator should be shown when dragging items.
   * @default false
   */
  showDropIndicator?: boolean;

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
  onDragEnd?: (result: DropResult) => void;

  /**
   * Callback function called when an item in the tree is clicked.
   * @param id - The id of the clicked item.
   */
  onItemClick?: (id: UniqueIdentifier) => void;
}

/**
 * Represents the result of a drag operation in the tree.
 */
export interface DropResult {
  /**
   * The item that was dragged.
   */
  movedItem: TreeItem;

  /**
   * The new parent of the dragged item, or null if it's now a root item.
   */
  parent: TreeItem | null;

  /**
   * The new index of the dragged item within its parent's children array.
   */
  index: number;
}
