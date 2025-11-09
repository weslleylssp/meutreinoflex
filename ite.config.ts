import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 👉 substitua pelo nome EXATO do repositório no GitHub
const repoName = "meutreinoflex";

export default defineConfig({
  plugins: [react()],
  base: `/${repoName}/`,
  build: {
    outDir: "dist",
  },
});
