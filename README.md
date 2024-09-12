# @clevertask/react-sortable-tree

A customizable React component for rendering and managing tree structures with drag-and-drop functionality.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Props](#props)
- [Types](#types)
  - [TreeItem](#treeitem)
  - [TreeItems](#treeitems)
  - [OptimizedTreeStructure](#optimizedtreestructure)
- [Helper Functions](#helper-functions)
  - [createOptimizedTreeStructure](#createoptimizedtreestructure)
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
import { SortableTree, createOptimizedTreeStructure } from '@clevertask/react-sortable-tree';

function App() {
  const [treeStructure, setTreeStructure] = useState(createOptimizedTreeStructure([
    { id: '1', label: 'Item 1', children: [] },
    { id: '2', label: 'Item 2', children: [
      { id: '3', label: 'Item 2.1', children: [] }
    ] },
  ]));

  return (
    <SortableTree
      items={treeStructure.items}
      onItemsChange={setTreeStructure}
      isCollapsible
      isRemovable
      allowNestedItemAddition
      // ... other props
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `TreeItems` | Required | The array of tree items to be rendered. |
| `onItemsChange` | `React.Dispatch<React.SetStateAction<OptimizedTreeStructure>>` | Required | Callback function called when the tree structure changes. |
| `indentationWidth` | `number` | `undefined` | The indentation width for children elements. |
| `isCollapsible` | `boolean` | `false` | Determines if tree items can be collapsed/expanded. |
| `onLazyLoadChildren` | `(id: UniqueIdentifier, isExpanding: boolean) => Promise<void>` | `undefined` | Callback for lazy loading child items when a parent is expanded. Useful for getting child items from an API endpoint |
| `showDropIndicator` | `boolean` | `false` | Determines if a drop indicator should be shown when dragging items. |
| `isRemovable` | `boolean` | `false` | Determines if items can be removed from the tree. |
| `onRemoveItem` | `(id: UniqueIdentifier) => void` | `undefined` | Callback function called when an item is removed from the tree. |
| `allowNestedItemAddition` | `boolean` | `false` | Determines if new items can be added as children to existing items. |
| `onAddItem` | `(parentId: UniqueIdentifier \| null) => void` | `undefined` | Callback function called when a new item is added to the tree. |
| `onDragEnd` | `(result: DropResult) => void` | `undefined` | Callback function called when a drag operation ends. |
| `onItemClick` | `(id: UniqueIdentifier) => void` | `undefined` | Callback function called when an item in the tree is clicked. |

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

### OptimizedTreeStructure

```typescript
interface OptimizedTreeStructure {
  items: TreeItems;
  itemMap: Map<UniqueIdentifier, TreeItem>;
}
```

The `OptimizedTreeStructure` is used internally to improve performance for large trees. Use the `createOptimizedTreeStructure` function to create this structure from a `TreeItems` array.

## Helper Functions

### createOptimizedTreeStructure

```typescript
function createOptimizedTreeStructure(items: TreeItems): OptimizedTreeStructure
```

## Helper Functions

### createOptimizedTreeStructure

```typescript
function createOptimizedTreeStructure(items: TreeItems): OptimizedTreeStructure
```

Use this function to create an `OptimizedTreeStructure` from a `TreeItems` array. This is useful when initializing your state or converting a plain tree structure into an optimized one.

### removeItemById

```typescript
function removeItemById(structure: OptimizedTreeStructure, id: UniqueIdentifier): OptimizedTreeStructure
```

This function removes an item from the tree structure by its ID. It returns a new `OptimizedTreeStructure` with the item removed from both the `items` array and the `itemMap`. It also handles removing the item from nested children.

Usage example:
```typescript
const updatedStructure = removeItemById(currentStructure, '123');
setTreeStructure(updatedStructure);
```

### setTreeItemProperties

```typescript
function setTreeItemProperties(
  structure: OptimizedTreeStructure,
  id: UniqueIdentifier,
  setter: (value: TreeItem) => Partial<TreeItem>
): OptimizedTreeStructure
```

This function updates the properties of a specific tree item. It takes a setter function that receives the current item and returns an object with the properties to be updated. It returns a new `OptimizedTreeStructure` with the updated item in both the `items` array and the `itemMap`.

Usage example:
```typescript
setTreeStructure((treeStructure) => {
  return setTreeItemProperties(
    treeStructure,
    '123',
    (item) => ({ label: 'New Label', collapsed: !item.collapsed })
  );
});
```

These helper functions are designed to work with the `OptimizedTreeStructure` to ensure efficient updates to the tree. They maintain both the tree hierarchy in the `items` array and the fast lookup `O(1)` capability of the `itemMap`.

Use this function to create an `OptimizedTreeStructure` from a `TreeItems` array. This is useful when initializing your state.

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
