import path from "path"
import { fileURLToPath, URL } from "url"

import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { viteSingleFile } from "vite-plugin-singlefile"

const build = process.env.LIB
  ? {
    lib: {
      entry: path.resolve(__dirname, "src/components/index.ts"),
      name: "duckdb-explain-visualizer",
      fileName: (format) => `duckdb-explain-visualizer.${format === 'es' ? 'mjs' : 'umd.js'}`,
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        globals: {
          vue: "Vue",
        },
      },
    },
  }
  : {
    outDir: "dist-app",
    target: "esnext",
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    brotliSize: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  }

// https://vitejs.dev/config/
export default defineConfig({
  build: build,
  plugins: [
    vue({
      template: {
        compilerOptions: {
          whitespace: "preserve",
        },
      },
    }),
    viteSingleFile(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  },
})
