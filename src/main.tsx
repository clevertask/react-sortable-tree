import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createOptimizedTreeStructure, SortableTree } from './index';

const App = () => {
  const [treeStructure, setTreeStructure] = useState(
    createOptimizedTreeStructure([
      { id: '1', label: 'Hello', children: [] },
      {
        id: '2',
        label: 'World',
        children: [{ id: '2.2', label: 'Hello world!', children: [] }],
      },
    ]),
  );

  return (
    <SortableTree
      treeStructure={treeStructure}
      setTreeStructure={setTreeStructure}
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
