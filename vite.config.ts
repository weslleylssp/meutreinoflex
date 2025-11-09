import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/meutreinoflex/", // ⚠️ o nome exato do repositório, com barras antes e depois
  build: {
    outDir: "dist",
  },
});
