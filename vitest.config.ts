import { defineConfig } from "vitest/config";

export default defineConfig({
  cacheDir: "../node_modules/.vitest",
  test: {
    globals: true,
    root: "./src",
    include: [`**/*.spec.ts`],
  },
});
