import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];

export default defineConfig({
  base: repositoryName ? `/${repositoryName}/` : "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/leaflet")) return "map-vendor";
          return undefined;
        },
      },
    },
  },
  plugins: [react()],
});
