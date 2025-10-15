import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'wc-prescription-list',
  build: {
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        assetFileNames: `[name].[ext]`,
        manualChunks(id) {
          if (id.includes('styles')) {
            return 'wc-prescription-list';
          }

          const idArr = id.split('/');
          const lastItem = idArr.pop();
          const stringArr = lastItem.split('.');

          return stringArr[0];
        },
      },
      input: {
        'wc-prescription-list': path.resolve(__dirname, 'build.js'),
      },
    },
    outDir: './../dist/wc-prescription-list/build',
    emptyOutDir: true,
  },
});
