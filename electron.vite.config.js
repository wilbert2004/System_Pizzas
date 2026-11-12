import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const directorioActual = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: resolve(directorioActual, "electron/proceso-principal/index.js"),
      },
    },
  },

  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: resolve(directorioActual, "electron/precarga/index.js"),
        output: {
          format: "cjs",
          entryFileNames: "index.cjs",
        },
      },
    },
  },

  renderer: {
    root: directorioActual,
    base: "./",
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        input: resolve(directorioActual, "index.html"),
      },
    },
  },
});
