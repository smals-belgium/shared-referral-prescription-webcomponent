import { defineConfig } from "vite";
import path from 'path'


export default defineConfig({
  root: "wc-evf-form-details",
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
      input: {
        "evf-form-details": path.resolve(__dirname, 'build.js')
      }
    },
    outDir: './../dist/evf-form-details/build',
    emptyOutDir: true
  }
});
