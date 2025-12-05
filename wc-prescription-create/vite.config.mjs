import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'wc-prescription-create',
  build: {
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        assetFileNames: `[name].[ext]`,
        format: 'iife',
      },
      input: {
        'wc-prescription-create': path.resolve(__dirname, 'build.js'),
      },
    },
    outDir: './../dist/wc-prescription-create/build',
    emptyOutDir: true,
  },
});
