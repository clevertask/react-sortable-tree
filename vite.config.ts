import dts from 'vite-plugin-dts';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { dirname, resolve } from 'path';
import react from '@vitejs/plugin-react-swc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react(), dts({ tsconfigPath: './tsconfig.app.json' })],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
    },
		rollupOptions: {
			external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client']
		},
		sourcemap: true,
  }
});
