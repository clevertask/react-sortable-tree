import { makeStaticStyles } from '@griffel/react';

type SortableTreeStyleOptions = {
  indicatorColor?: string;
  indicatorBorderColor?: string;
  indicatorDotColor?: string;
};

export const createSortableTreeGlobalStyles = (options?: SortableTreeStyleOptions) =>
  makeStaticStyles({
    '[data-ghost="true"][data-indicator="true"]': {
      opacity: 1,
      position: 'relative',
      zIndex: 1,
      marginBottom: '-1px',
    },

    '[data-ghost="true"][data-indicator="true"] [data-slot="draggableItem"]': {
      position: 'relative',
      padding: 0,
      height: '8px',
      borderColor: options?.indicatorBorderColor ?? '#2389ff',
      backgroundColor: options?.indicatorColor ?? '#56a1f8',
    },

    '[data-ghost="true"][data-indicator="true"] [data-slot="draggableItem"]::before': {
      content: '""',
      position: 'absolute',
      left: '-8px',
      top: '-4px',
      display: 'block',
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      border: `1px solid ${options?.indicatorBorderColor ?? '#2389ff'}`,
      backgroundColor: options?.indicatorDotColor ?? '#ffffff',
    },
  });
