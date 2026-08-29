import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" keeps asset URLs relative so the same build works from a GitHub
// Pages project subpath (/zfr-wiki/) or a domain root. Routing is hash-based
// (see src/App.tsx) so deep links never hit a 404 on Pages.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    // Icons are many small files; don't inline them as data URIs.
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
});
