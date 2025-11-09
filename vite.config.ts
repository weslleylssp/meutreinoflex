import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/meutreinoflex/", // 👈 o nome do repositório exato
});
