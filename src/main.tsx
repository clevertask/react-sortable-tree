import { forwardRef, StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getItemById, SortableTree, TreeItem, TreeItems, TreeItemStructure } from './index';
import { RenderItemProps } from './SortableTree/components/TreeItem/TreeItem';

type CustomTreeItem = TreeItem<{
  icon?: string;
  description?: string;
  metadata?: Record<string, any>;
}>;
type MyTreeItem = TreeItems<CustomTreeItem>;

const MyCustomTreeItem = forwardRef<
  HTMLDivElement,
  { treeItem: CustomTreeItem; dragListeners: RenderItemProps['dragListeners'] }
>(({ treeItem, dragListeners }, ref) => {
  return (
    <div ref={ref}>
      <span {...dragListeners}>Drag me</span>
      <strong>{treeItem.label}</strong>
      <button onClick={() => console.log(treeItem.metadata)}>Remove</button>
    </div>
  );
});

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

  useEffect(() => {
    console.log(getItemById(treeItems, '2'));
  }, [treeItems]);

  return (
    <SortableTree
      items={treeItems}
      setItems={setTreeItems}
      isRemovable
      allowNestedItemAddition
      showDropIndicator
      renderItem={(props) => {
        return (
          <TreeItemStructure
            {...props}
            asDraggableItem={MyCustomTreeItem}
            draggableItemProps={{ treeItem: props.treeItem, dragListeners: props.dragListeners }}
          />

          // <TreeItemStructure {...props}>
          //   <Handle {...props.dragListeners} />
          //   <span>{props.treeItem.label}</span>
          //   <button onClick={() => console.log(props.treeItem.id)}>Toggle</button>
          //   <button onClick={() => console.log(props.treeItem.id)}>Remove</button>
          //   <button onClick={() => console.log(props.treeItem.id)}>Add</button>
          // </TreeItemStructure>
        );
      }}
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
