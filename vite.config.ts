import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/meutreinoflex/", // ⚠️ use exatamente o nome do seu repositório
  build: {
    outDir: "dist",
  },
});
