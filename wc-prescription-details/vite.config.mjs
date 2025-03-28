import { defineConfig,splitVendorChunkPlugin } from "vite";
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'


export default defineConfig({
  plugins: [splitVendorChunkPlugin(),
    viteStaticCopy({
      targets: [
        {
          src: './../dist/evf-form-details/build/evf-form-details.js',
          dest: './assets/evf-form-details',
        },
        {
          src: './../dist/pdfmake/build/pdfmake.js',
          dest: './assets/pdfmake',
        },
      ],
    }),],
  root: "wc-prescription-details",
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        assetFileNames: `[name].[ext]`,
        manualChunks(id) {

          if(id.includes('styles')) {
            return 'wc-prescription-details'
          }

          const idArr = id.split("/");
          const lastItem = idArr.pop();
          const stringArr = lastItem.split(".");

          return stringArr[0];
        },
      },
      input: {
        "wc-prescription-details": path.resolve(__dirname, 'build.js'),
      }
    },
    outDir: './../dist/wc-prescription-details/build',
    emptyOutDir: true
  }
});
