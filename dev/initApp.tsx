import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App, MyTreeItem } from '../src/main';

export const initApp = (initialItems?: MyTreeItem) => {
  const rootElement = document.getElementById('root');

  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <App initialItems={initialItems} />
      </StrictMode>,
    );
  } else {
    console.error('Root element not found');
  }
};
