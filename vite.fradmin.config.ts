import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// 品牌方管理后台（fradmin）独立构建，输出到 cloudbase-deploy/fradmin/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "cloudbase-deploy/fradmin",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "fradmin.html"),
      },
    },
  },
});
