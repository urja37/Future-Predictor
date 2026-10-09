import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@bklitui/ui/charts": path.resolve(__dirname, "./bklit-ui/packages/ui/src/charts/index.ts"),
      "@bklitui/ui/lib/utils": path.resolve(__dirname, "./bklit-ui/packages/ui/src/lib/utils.ts"),
      "@bklitui/ui": path.resolve(__dirname, "./bklit-ui/packages/ui/src"),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
