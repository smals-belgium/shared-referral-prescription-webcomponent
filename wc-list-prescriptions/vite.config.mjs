import { defineConfig,splitVendorChunkPlugin } from "vite";
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'


export default defineConfig({
  plugins: [splitVendorChunkPlugin(),
    viteStaticCopy({
      targets: [
        {
          src: './../dist/wc-list-prescriptions/browser/keycloak.js',
          dest: './',
        },
      ],
    }),],
  root: "wc-list-prescriptions",
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        assetFileNames: `[name].[ext]`,
        manualChunks(id) {

          if(id.includes('styles')) {
            return 'wc-list-prescriptions'
          }

          const idArr = id.split("/");
          const lastItem = idArr.pop();
          const stringArr = lastItem.split(".");

          return stringArr[0];
        },
      },
      input: {
        "wc-list-prescriptions": path.resolve(__dirname, 'build.js')
      }
    },
    outDir: './../dist/wc-list-prescriptions/build',
    emptyOutDir: true
  }
});
