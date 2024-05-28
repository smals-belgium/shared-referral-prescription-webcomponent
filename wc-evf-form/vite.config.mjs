import { defineConfig } from "vite";
import path from 'path'


export default defineConfig({
  root: "wc-evf-form",
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
      input: {
        "evf-form": path.resolve(__dirname, 'build.js')
      }
    },
    outDir: './../dist/evf-form/build',
    emptyOutDir: true
  }
});
