import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: './tsconfig.app.json',
      entryRoot: 'e2e/utils',
      outDir: 'dist/e2e/utils',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'e2e/utils/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['@playwright/test'],
    },
    outDir: 'dist/e2e',
    emptyOutDir: false,
  },
});
