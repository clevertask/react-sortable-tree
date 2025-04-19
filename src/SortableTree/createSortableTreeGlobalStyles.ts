import { makeStaticStyles } from '@griffel/react';

type SortableTreeStyleOptions = {
  indicatorColor?: string;
  indicatorBorderColor?: string;
  indicatorDotColor?: string;
  dragBoxShadow?: string;
};

export const createSortableTreeGlobalStyles = (options?: SortableTreeStyleOptions) =>
  makeStaticStyles({
    '[data-ghost="true"][data-indicator="true"]': {
      opacity: 1,
      position: 'relative',
      zIndex: 1,
      marginBottom: '-1px',
    },

    '[data-clone="true"] [data-slot="dropZone"]': {
      display: 'inline-block',
      pointerEvents: 'none',
      padding: 0,
      paddingLeft: '10px',
      paddingTop: '5px',
    },

    '[data-ghost="true"][data-indicator="true"] [data-slot="draggableItem"]': {
      position: 'relative',
      padding: 0,
      border: 'none !important',
      borderTop: `2px solid ${options?.indicatorBorderColor ?? '#2389ff'} !important`,
    },

    '[data-ghost="true"][data-indicator="true"] [data-slot="draggableItem"]::before': {
      content: '""',
      position: 'absolute',
      left: '-8px',
      top: '-8px',
      display: 'block',
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      border: `2px solid ${options?.indicatorBorderColor ?? '#2389ff'} !important`,
      backgroundColor: `${options?.indicatorDotColor ?? '#ffffff'} !important`,
    },

    '[data-slot="dropZone"][data-ghost="true"][data-indicator="true"] [data-slot="draggableItem"] > *':
      {
        display: 'none',
      },

    '[data-slot="dropZone"][data-ghost="true"]:not([data-indicator="true"])': {
      opacity: 0.5,
    },

    '[data-slot="dropZone"][data-clone="true"] [data-slot="draggableItem"]': {
      boxShadow: options?.dragBoxShadow ?? '0px 15px 15px 0 rgba(34, 33, 81, 0.1);',
    },
  });
