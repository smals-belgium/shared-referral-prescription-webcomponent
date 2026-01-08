import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'wrappers/components/mags-prescription-details',
  build: {
    rollupOptions: {
      output: {
        format: 'iife',
        esModule: true,
        entryFileNames: 'index.js',
      },
      input: {
        'mags-prescription-details': path.resolve(__dirname, './build.js'),
      },
      plugins: [],
    },
    outDir: './../../../dist/mags-prescription-details/mags',
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, './build.js'),
      formats: ['esm'],
      fileName: () => `index.js`,
    },
  },
});
