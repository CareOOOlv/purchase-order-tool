import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// 加盟商订货端（fr）独立构建，输出到 cloudbase-deploy/fr/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "cloudbase-deploy/fr",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "fr.html"),
      },
    },
  },
});
