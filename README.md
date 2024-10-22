# @clevertask/react-sortable-tree

A customizable React component for rendering and managing tree structures with drag-and-drop functionality. This is built on top of the [sortable tree Component from the dnd-kit library](https://github.com/clauderic/dnd-kit/blob/master/stories/3%20-%20Examples/Tree/SortableTree.tsx).

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Props](#props)
- [Types](#types)
  - [TreeItem](#treeitem)
  - [TreeItems](#treeitems)
- [Helper Functions](#helper-functions)
  - [getItemById](#getItemById)
  - [removeItemById](#removeitembyid)
  - [setTreeItemProperties](#settreeitemproperties)
- [Roadmap](#roadmap)
- [Release Process](#release-process)
- [License](#license)

## Installation

```bash
npm install @clevertask/react-sortable-tree
```

## Usage

```tsx
import '@clevertask/react-sortable-tree/dist/style.css';
import React, { useState } from 'react';
import { SortableTree, TreeItems } from '@clevertask/react-sortable-tree';

function App() {
  const [items, setItems] = useState<TreeItems>([
    { id: '1', label: 'Item 1', children: [] },
    { id: '2', label: 'Item 2', children: [{ id: '3', label: 'Item 2.1', children: [] }] },
  ]);

  return (
    <SortableTree
      items={items}
      setItems={setItems}
      isCollapsible
      isRemovable
      allowNestedItemAddition
      // ... other props
    />
  );
}
```

## Props

| Prop                      | Type                                                            | Default     | Description                                                                                                          |
| ------------------------- | --------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| `items`                   | `TreeItems`                                                     | Required    | The array of tree items to be rendered.                                                                              |
| `setItems`                | `React.Dispatch<React.SetStateAction<TreeItems>>`               | Required    | Callback function called when the tree items array changes.                                                          |
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

## Types

### TreeItem

```typescript
type TreeItem = {
  id: UniqueIdentifier;
  label: string;
  children: TreeItem[];
  collapsed?: boolean;
  canFetchChildren?: boolean;
  disableDragging?: boolean;
  [key: string]: any;
};
```

### TreeItems

```typescript
type TreeItems = TreeItem[];
```

## Helper Functions

### getItemById

```typescript
function getItemById(items: TreeItems, id: UniqueIdentifier): TreeItem | undefined;
```

Retrieves a tree item by its unique identifier.

Usage example:

```typescript
const item = getItemById(items, '1');
```

### removeItemById

```typescript
function removeItemById(items: TreeItems, id: UniqueIdentifier): TreeItems;
```

This function removes an item from the tree structure by its ID. It returns a new `TreeItems` array with the item removed. It also handles removing the item from nested children.

Usage example:

```typescript
const updatedItems = removeItemById(items, '123');
setItems(updatedItems);
```

### setTreeItemProperties

```typescript
function setTreeItemProperties(
  items: TreeItems,
  id: UniqueIdentifier,
  setter: (value: TreeItem) => Partial<TreeItem>,
): TreeItems;
```

This function updates the properties of a specific tree item. It takes a setter function that receives the current item and returns an object with the properties to be updated. It returns a new `TreeItems` array with the updated item.

Usage example:

```typescript
setItems((items) => {
  return setTreeItemProperties(items, '123', (item) => ({
    label: 'New Label',
    collapsed: !item.collapsed,
  }));
});
```

## Roadmap

We're constantly working to improve @clevertask/react-sortable-tree. Here are some features we're planning to implement:

- **Virtualization**: Improve performance for large trees by only rendering visible nodes.
- **Custom item rendering**: Allow users to provide custom components for rendering tree items.
- **Selection and Multi-selection**: Add support for selecting one or multiple items in the tree.
- **Drag multiple items**: Enable dragging and dropping multiple selected items at once.
- **API Example**: Provide a comprehensive example illustrating real-world usage with a backend API.
- **E2E tests**: It will ensure this component's working as expected.

We're excited about these upcoming features and welcome any feedback or contributions from the community. If you have any suggestions or would like to contribute to any of these features, please open an issue or submit a pull request on our GitHub repository.

## Release Process

This package is automatically published to npm when a new release is created on GitHub. To create a new release:

1. Update the version in `package.json` according to semantic versioning rules.
2. Commit the version change: `git commit -am "Bump version to x.x.x"`
3. Create a new tag: `git tag vx.x.x`
4. Push the changes and the tag: `git push && git push --tags`
5. Go to the GitHub repository and create a new release, selecting the tag you just created.

The GitHub Action will automatically build, test, and publish the new version to npm.

## License

MIT
