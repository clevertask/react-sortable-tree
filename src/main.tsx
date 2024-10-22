import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getItemById, SortableTree, TreeItems } from './index';

const App = () => {
  const [treeItems, setTreeItems] = useState<TreeItems>([
    { id: '1', label: 'Hello', children: [] },
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
