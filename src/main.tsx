import { createRoot } from 'react-dom/client';
import { StrictMode, useState } from 'react';
import { Handle } from './SortableTree/components/Handle';
import {
  createSortableTreeGlobalStyles,
  moveItemAfter,
  moveItemBefore,
  moveItemInside,
  SortableTree,
  TreeItem,
  TreeItems,
  TreeItemStructure,
} from './index';
import { RenderItemProps } from './SortableTree/components/TreeItem/TreeItem';
import type { DropResult, MoveTreeItemResult } from './index';

type CustomTreeItem = TreeItem<{
  icon?: string;
  description?: string;
}>;
type MyTreeItem = TreeItems<CustomTreeItem>;

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
  const [lastMoveResult, setLastMoveResult] = useState<DropResult<CustomTreeItem>>(null);

  const runProgrammaticMove = (
    moveFn: (items: MyTreeItem) => MoveTreeItemResult<CustomTreeItem>,
  ) => {
    setTreeItems((currentItems) => {
      const { items, result } = moveFn(currentItems);
      setLastMoveResult(result);
      return items;
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
