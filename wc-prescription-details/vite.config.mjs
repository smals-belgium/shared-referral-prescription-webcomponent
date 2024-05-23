import { defineConfig } from "vite";
import path from 'path'


export default defineConfig({
  root: "wc-prescription-details",
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        assetFileNames: `[name].[ext]`,
      },
      input: {
        "wc-prescription-details": path.resolve(__dirname, 'build.js')
      }
    },
    outDir: './../dist/build'
  }
});
