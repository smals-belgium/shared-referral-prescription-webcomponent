import { defineConfig } from "vite";
import path from 'path'


export default defineConfig({
  root: "wc-pdfmake",
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
      input: {
        "wc-pdfmake": path.resolve(__dirname, 'build.js')
      }
    },
    outDir: './../dist/build'
  }
});
