import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: './../dist/evf-form/build/evf-form.js',
          dest: './assets/evf-form',
        },
      ],
    }),
  ],
  root: 'wc-prescription-create',
  build: {
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        assetFileNames: `[name].[ext]`,
        manualChunks(id) {
          if (id.includes('styles')) {
            return 'wc-prescription-create';
          }

          const idArr = id.split('/');
          const lastItem = idArr.pop();
          const stringArr = lastItem.split('.');

          return stringArr[0];
        },
      },
      input: {
        'wc-prescription-create': path.resolve(__dirname, 'build.js'),
      },
    },
    outDir: './../dist/wc-prescription-create/build',
    emptyOutDir: true,
  },
});
