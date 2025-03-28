import {defineConfig, splitVendorChunkPlugin} from "vite";
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'


export default defineConfig({
  plugins: [splitVendorChunkPlugin(),
    viteStaticCopy({
      targets: [
        {
          src: './../dist/evf-form/build/evf-form.js',
          dest: './assets/evf-form',
        },
        {
          src: './../dist/evf-form/build/evf-form.css',
          dest: './assets/evf-form',
        },
      ],
    }),],
  root: "wc-create-prescription",
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        assetFileNames: `[name].[ext]`,
        manualChunks(id) {

          if(id.includes('styles')) {
            return 'wc-create-prescription'
          }

          const idArr = id.split("/");
          const lastItem = idArr.pop();
          const stringArr = lastItem.split(".");

          return stringArr[0];
        },
      },
      input: {
        "wc-create-prescription": path.resolve(__dirname, 'build.js'),
      }
    },
    outDir: './../dist/wc-create-prescription/build',
    emptyOutDir: true
  }
});
