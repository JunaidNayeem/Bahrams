import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Vite 8 resolves tsconfig `paths` (the "@/*" alias) natively; it replaces vite-tsconfig-paths.
  resolve: { tsconfigPaths: true },
  test: {
    exclude: [...configDefaults.exclude, "e2e/**", ".next/**"],
    restoreMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
});
