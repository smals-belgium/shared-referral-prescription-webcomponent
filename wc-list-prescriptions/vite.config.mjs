import { defineConfig } from "vite";
import path from 'path'


export default defineConfig({
  root: "wc-list-prescriptions",
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        assetFileNames: `[name].[ext]`,
      },
      input: {
        "wc-list-prescriptions": path.resolve(__dirname, 'build.js')
      }
    },
    outDir: './../dist/build'
  }
});
