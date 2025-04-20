# @clevertask/react-sortable-tree

A customizable React component for rendering and managing tree structures with drag-and-drop functionality. Built on top of the [dnd-kit sortable tree example](https://github.com/clauderic/dnd-kit/blob/master/stories/3%20-%20Examples/Tree/SortableTree.tsx).

This library is currently focused on **custom item rendering** and **type-safe tree structures**. A more detailed API and feature set will be released in a future major version with support for virtualization and multi-selection.

---

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Props](#props)
- [Types](#types)
- [Helper Functions](#helper-functions)
- [Roadmap](#roadmap)
- [License](#license)

---

## Installation

```bash
npm install @clevertask/react-sortable-tree
```

---

## Usage

### 1. Define your custom tree item type if needed

```ts
type CustomTreeItem = TreeItem<{
  metadata?: Record<string, any>;
  icon?: string;
}>;
```

Otherwise, the component will use the default [tree item type](#types).

---

### 2. Create your custom item component

This is the basic structure you can start with:

```tsx
import {
  RenderItemProps,
  TreeItemStructure,
  createSortableTreeGlobalStyles,
  RenderItemProps,
} from '@clevertask/react-sortable-tree';

export const TreeItem = ({ treeItem, collapsed, onCollapse, ...rest }: RenderItemProps) => {
  <TreeItemStructure {...rest}>
    <button {...dragListeners}>Drag me</button>
    {onCollapse && <button onClick={onCollapse}>{collapsed ? 'Expand' : 'Collapse'}</button>}

    <h5>{treeItem.label}</h5>

    <button onClick={() => openItemInfoModal(treeItem.id)}>Show treeItem info</button>
  </TreeItemStructure>;
};
```

This is a real-world example using Radix:

```tsx
import {
  RenderItemProps,
  TreeItemStructure,
  createSortableTreeGlobalStyles,
  TreeItem as TTreeItem,
} from '@clevertask/react-sortable-tree';
import {
  DragHandleDots2Icon,
  ChevronRightIcon,
  ChevronDownIcon,
  TrashIcon,
  PlusIcon,
} from '@radix-ui/react-icons';
import { Flex, Button, Text, Box } from '@radix-ui/themes';
import { CustomTreeItem } from '.';

export const TreeItem = ({
  treeItem,
  dragListeners,
  onCollapse,
  collapsed,
  onClickAddNestedItemButton,
  onClickItemRemoveButton,
  onItemClick,
  ...rest
}: RenderItemProps<CustomTreeItem> & {
  onClickAddNestedItemButton: (id: string) => void;
  onClickItemRemoveButton: (id: string) => void;
  onItemClick: (id: string) => void;
}) => {
  const useSortableTreeGlobalStyles = createSortableTreeGlobalStyles({
    indicatorColor: 'var(--orange-7)',
    indicatorBorderColor: 'var(--orange-7)',
  });

  useSortableTreeGlobalStyles();

  return (
    <TreeItemStructure
      {...rest}
      asDropZone={Box}
      asDraggableItem={Box}
      draggableItemStyle={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '1rem',
        border: '1px solid var(--gray-3)',
        background: 'var(--color-background)',
      }}
    >
      <Flex align="center" gap="5" direction="row">
        <Button color="gray" variant="ghost" {...dragListeners}>
          <DragHandleDots2Icon />
        </Button>

        {onCollapse && (
          <Button color="gray" variant="ghost" onClick={onCollapse}>
            {collapsed ?
              <ChevronRightIcon />
            : <ChevronDownIcon />}
          </Button>
        )}

        <Text style={{ cursor: 'pointer' }} onClick={() => onItemClick(treeItem.id)}>
          {treeItem.label} {treeItem.metadata.foo}
        </Text>
      </Flex>

      <Flex align="center" gap="3" direction="row">
        <Button variant="ghost" color="red" onClick={() => onClickItemRemoveButton(treeItem.id)}>
          <TrashIcon />
        </Button>
        <Button
          variant="ghost"
          color="gray"
          onClick={() => onClickAddNestedItemButton(treeItem.id)}
        >
          <PlusIcon />
        </Button>
      </Flex>
    </TreeItemStructure>
  );
};
```

The `<TreeItemStructure/>` appends the dataSlots (for CSS styles), dropzone, and drag item container listeners and refs so you don't have to do it from scratch, but it's possible making your custom tree items without that component.

---

### 3. Use the `SortableTree` with your custom item

```tsx
import React, { useState } from 'react';
import { TreeItems, SortableTree } from '@clevertask/react-sortable-tree';
type CustomTreeItem = TreeItem<{ metadata?: Record<string, string> }>;

const [items, setItems] = useState<TreeItems<CustomTreeItem>>([
  { id: '1', label: 'Item 1', children: [] },
  {
    id: '2',
    label: 'Item 2',
    children: [{ id: '3', label: 'Item 2.1', children: [] }],
    metadata: { foo: 'foo' },
  },
]);

<SortableTree<CustomTreeItem>
  isCollapsible
  showDropIndicator
  items={items}
  setItems={setItems}
  renderItem={(props: RenderItemProps<CustomTreeItem>) => (
    <TreeItem
      {...props}
      onClickAddNestedItemButton={onClickAddNestedItemButton}
      onClickItemRemoveButton={onClickItemRemoveButton}
      onItemClick={onItemClick}
    />
  )}
/>;
```

---

## Props

| Prop                      | Type                                                            | Default     | Description                                                                                                          |
| ------------------------- | --------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| `items`                   | `TreeItems<T>`                                                  | Required    | The array of tree items to be rendered.                                                                              |
| `setItems`                | `(items: TreeItems<T>) => void`                                 | Required    | Callback function called when the tree items array changes.                                                          |
| `renderItem`              | `(props: RenderItemProps<T>) => React.ReactNode`                | Required    | Function to render each tree item.                                                                                   |
| `indentationWidth`        | `number`                                                        | `undefined` | The indentation width for children elements.                                                                         |
| `isCollapsible`           | `boolean`                                                       | `false`     | Determines if tree items can be collapsed/expanded.                                                                  |
| `onLazyLoadChildren`      | `(id: UniqueIdentifier, isExpanding: boolean) => Promise<void>` | `undefined` | Callback for lazy loading child items when a parent is expanded. Useful for getting child items from an API endpoint |
| `showDropIndicator`       | `boolean`                                                       | `false`     | Determines if a drop indicator should be shown when dragging items.                                                  |
| `isRemovable`             | `boolean`                                                       | `false`     | Determines if items can be removed from the tree.                                                                    |
| `onRemoveItem`            | `(id: UniqueIdentifier) => void`                                | `undefined` | Callback function called when an item is removed from the tree.                                                      |
| `allowNestedItemAddition` | `boolean`                                                       | `false`     | Determines if new items can be added as children to existing items.                                                  |
| `onAddItem`               | `(parentId: UniqueIdentifier \| null) => void`                  | `undefined` | Callback function called when a new item is added to the tree.                                                       |
| `onDragEnd`               | `(result: DropResult) => void`                                  | `undefined` | Callback function called when a drag operation ends.                                                                 |
| `onItemClick`             | `(id: UniqueIdentifier) => void`                                | `undefined` | Callback function called when an item in the tree is clicked.                                                        |

---

## Types

### TreeItem

```ts
type TreeItem<ExtraProps = unknown> = {
  id: UniqueIdentifier;
  label: string;
  children: TreeItem<ExtraProps>[];
  collapsed?: boolean;
  canFetchChildren?: boolean;
  disableDragging?: boolean;
} & ExtraProps;
```

### TreeItems

```ts
type TreeItems<T = TreeItem> = T[];
```

### TreeStructureProps

```ts
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
```

### RenderItemProps

```ts
export interface RenderItemProps<T extends TTreeItem = TTreeItem>
  extends Pick<
      TreeItemStructureProps,
      'classNames' | 'dropZoneStyle' | 'dropZoneRef' | 'draggableItemRef'
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
    dropZone: Record<string, string | boolean | undefined>;
    draggableItem: Record<string, string>;
  };
}
```

---

## Helper Functions

### getItemById

```ts
function getItemById<T extends TreeItem>(items: TreeItems<T>, id: UniqueIdentifier): T | undefined;
```

### removeItemById

```ts
function removeItemById<T extends TreeItem>(
  items: TreeItems<T>,
  id: UniqueIdentifier,
): TreeItems<T>;
```

### setTreeItemProperties

```ts
function setTreeItemProperties<T extends TreeItem>(
  items: TreeItems<T>,
  id: UniqueIdentifier,
  setter: (value: T) => Partial<T>,
): TreeItems<T>;
```

---

## Roadmap

- ✅ Custom item rendering (done!)
- 🔜 Virtualization for large trees
- 🔜 Multi-selection support
- 🔜 Drag multiple items
- 🔜 Keyboard navigation
- 🔜 API usage example
- 🔜 E2E tests

---

## License

MIT
