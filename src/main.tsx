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

const BASE_TREE = [
  { id: 'a', label: 'A', children: [] },
  {
    id: 'b',
    label: 'B',
    children: [{ id: 'b1', label: 'B1', children: [] }],
  },
  { id: 'c', label: 'C', children: [] },
];

const App = () => {
  const [treeItems, setTreeItems] = useState<MyTreeItem>(BASE_TREE);

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
            'aria-label': props.treeItem.label,
            parent: props.treeItem.parent?.label,
          },
        }}
      >
        {/*TODO: Make a component to inject the handler listeners so the dev only worries about the markup stuff*/}
        <Handle aria-label={`Drag ${props.treeItem.label}`} {...props.dragListeners} />
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
