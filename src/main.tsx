import { createRoot } from 'react-dom/client';
import { StrictMode, useState } from 'react';
import { Handle } from './SortableTree/components/Handle';
import {
  createSortableTreeGlobalStyles,
  SortableTree,
  TreeItem,
  TreeItems,
  TreeItemStructure,
} from './index';
import { RenderItemProps } from './SortableTree/components/TreeItem/TreeItem';

type CustomTreeItem = TreeItem<{
  icon?: string;
  description?: string;
  metadata?: Record<string, any>;
}>;
type MyTreeItem = TreeItems<CustomTreeItem>;

const App = () => {
  const [treeItems, setTreeItems] = useState<MyTreeItem>([
    { id: '1', label: 'Hello', children: [], metadata: { a: 'foo' } },
    {
      id: '2',
      label: 'World',
      children: [
        { id: '2.2', label: 'Hello world!', children: [{ id: '2.2.2', label: 'a', children: [] }] },
      ],
    },
  ]);

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
        dataSlots={{
          dropZone: {
            'aria-label': `Drop inside ${props.treeItem.label}`,
          },
        }}
      >
        <Handle {...props.dragListeners} />
        <p>{props.treeItem.label}</p>
      </TreeItemStructure>
    );
  };

  return (
    <SortableTree<CustomTreeItem>
      isCollapsible
      showDropIndicator
      items={treeItems}
      setItems={setTreeItems}
      renderItem={MyCustomTreeItem}
    />
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
