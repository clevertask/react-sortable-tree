import { createRoot } from 'react-dom/client';
import { StrictMode, useState } from 'react';
import { Handle } from './SortableTree/components/Handle';
import {
  createSortableTreeGlobalStyles,
  moveItemAfter,
  moveItemBefore,
  moveItemInside,
  moveItemsAfter,
  moveItemsBefore,
  moveItemsInside,
  removeItemById,
  removeItemsById,
  SortableTree,
  TreeItem,
  TreeItems,
  TreeItemStructure,
} from './index';
import { RenderItemProps } from './SortableTree/components/TreeItem/TreeItem';
import type { DropResult, MoveTreeItemResult, MoveTreeItemsResult } from './index';

type CustomTreeItem = TreeItem<{
  icon?: string;
  description?: string;
}>;
type MyTreeItem = TreeItems<CustomTreeItem>;
type LastMoveResult = DropResult<CustomTreeItem> | DropResult<CustomTreeItem>[];
type ProgrammaticMoveResult =
  | MoveTreeItemResult<CustomTreeItem>
  | MoveTreeItemsResult<CustomTreeItem>;

const BASE_TREE: MyTreeItem = [
  { id: 'a', label: 'A', parentId: null },
  { id: 'z', label: 'Z', parentId: 'a' },
  { id: 'b', label: 'B', parentId: null },
  { id: 'b1', label: 'B1', parentId: 'b' },
  { id: 'c', label: 'C', parentId: null },
  { id: 'd', label: 'D', parentId: null },
  { id: 'e', label: 'E', parentId: null },
];

const App = () => {
  const [treeItems, setTreeItems] = useState<MyTreeItem>(BASE_TREE);
  const [lastMoveResult, setLastMoveResult] = useState<LastMoveResult>(null);

  const runProgrammaticMove = (moveFn: (items: MyTreeItem) => ProgrammaticMoveResult) => {
    setTreeItems((currentItems) => {
      const moveResult = moveFn(currentItems);

      if ('results' in moveResult) {
        setLastMoveResult(moveResult.results);
      } else {
        setLastMoveResult(moveResult.result);
      }

      return moveResult.items;
    });
  };

  const runProgrammaticRemove = (removeFn: (items: MyTreeItem) => MyTreeItem) => {
    setTreeItems((currentItems) => {
      const nextItems = removeFn(currentItems);
      setLastMoveResult(null);
      return nextItems;
    });
  };

  const MyCustomTreeItem = (props: RenderItemProps<CustomTreeItem>) => {
    const useSortableTreeGlobalStyles = createSortableTreeGlobalStyles({
      indicatorColor: 'red',
      indicatorBorderColor: 'red',
    });

    useSortableTreeGlobalStyles();

    return (
      <TreeItemStructure
        {...props}
        draggableItemStyle={{ background: 'violet', display: 'flex', border: '1px solid yellow' }}
      >
        <TreeItemStructure.DragHandler>
          <Handle />
        </TreeItemStructure.DragHandler>

        <p data-tree-item-label>{props.treeItem.label}</p>
      </TreeItemStructure>
    );
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => runProgrammaticMove((items) => moveItemAfter(items, 'b1', 'z'))}>
          Move B1 after Z
        </button>
        <button onClick={() => runProgrammaticMove((items) => moveItemBefore(items, 'd', 'b'))}>
          Move D before B
        </button>
        <button onClick={() => runProgrammaticMove((items) => moveItemInside(items, 'e', 'a'))}>
          Move E inside A
        </button>
        <button
          onClick={() => runProgrammaticMove((items) => moveItemsBefore(items, ['a', 'b'], 'e'))}
        >
          Move A + B before E
        </button>
        <button
          onClick={() => runProgrammaticMove((items) => moveItemsAfter(items, ['a', 'b'], 'c'))}
        >
          Move A + B after C
        </button>
        <button
          onClick={() => runProgrammaticMove((items) => moveItemsInside(items, ['a', 'b'], 'c'))}
        >
          Move A + B inside C
        </button>
        <button
          onClick={() =>
            runProgrammaticMove((items) =>
              moveItemsInside(items, ['a', 'z'], 'c', {
                overlapBehavior: 'extract-selected-descendants',
              }),
            )
          }
        >
          Extract A + Z inside C
        </button>
        <button onClick={() => runProgrammaticRemove((items) => removeItemById(items, 'b'))}>
          Remove B
        </button>
        <button
          onClick={() => runProgrammaticRemove((items) => removeItemsById(items, ['a', 'z']))}
        >
          Remove A + Z
        </button>
        <button
          onClick={() => {
            setTreeItems(BASE_TREE);
            setLastMoveResult(null);
          }}
        >
          Reset tree
        </button>
      </div>

      <pre style={{ margin: 0, padding: 12, border: '1px solid #ddd' }}>
        {lastMoveResult
          ? JSON.stringify(lastMoveResult, null, 2)
          : 'Move result will appear here (programmatic or drag-and-drop).'}
      </pre>

      <SortableTree<CustomTreeItem>
        isCollapsible
        showDropIndicator
        items={treeItems}
        setItems={setTreeItems}
        renderItem={MyCustomTreeItem}
        onDragEnd={(result) => {
          setLastMoveResult(result);
          console.log(result);
        }}
      />
    </div>
  );
};

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} else {
  console.error('Root element not found');
}
