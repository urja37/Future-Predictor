import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["bklit-ui/**", "node_modules/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@bklitui/ui/charts": path.resolve(__dirname, "./bklit-ui/packages/ui/src/charts/index.ts"),
      "@bklitui/ui/lib/utils": path.resolve(__dirname, "./bklit-ui/packages/ui/src/lib/utils.ts"),
      "@bklitui/ui": path.resolve(__dirname, "./bklit-ui/packages/ui/src"),
    },
  },
});
