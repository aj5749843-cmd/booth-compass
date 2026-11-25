import { defineConfig } from "vite";
// dev.html is the source page; `npm run build` bundles it, then build-single.py
// inlines everything into index.html (one self-contained file served by GitHub Pages).
export default defineConfig({
  base: "./",
  build: {
    outDir: "build-tmp",
    emptyOutDir: true,
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: { input: "dev.html", output: { inlineDynamicImports: true } },
  },
});
