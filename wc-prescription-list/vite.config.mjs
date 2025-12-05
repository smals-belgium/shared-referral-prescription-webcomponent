import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'wc-prescription-list',
  build: {
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        assetFileNames: `[name].[ext]`,
        format: 'iife',
      },
      input: {
        'wc-prescription-list': path.resolve(__dirname, 'build.js'),
      },
    },
    outDir: './../dist/wc-prescription-list/build',
    emptyOutDir: true,
  },
});
