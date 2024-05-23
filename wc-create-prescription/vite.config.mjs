import { defineConfig } from "vite";
import path from 'path'


export default defineConfig({
  root: "wc-create-prescription",
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        assetFileNames: `[name].[ext]`,
      },
      input: {
        "wc-create-prescription": path.resolve(__dirname, 'build.js'),
      }
    },
    outDir: './../dist/build'
  }
});
