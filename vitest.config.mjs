import { defineConfig } from "vitest/config";
import { transformWithOxc } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Next.js stores JSX in many `.js` files; Vitest/Oxc needs an explicit JSX loader. */
function jsAsJsx() {
  return {
    name: "vite-plugin-js-as-jsx",
    enforce: "pre",
    async transform(code, id) {
      if (id.includes("node_modules")) return null;
      if (!id.endsWith(".js")) return null;
      if (!code.includes("</") && !code.includes("/>")) return null;
      return transformWithOxc(code, id, {
        lang: "jsx",
        jsx: { runtime: "automatic" },
      });
    },
  };
}

export default defineConfig({
  plugins: [jsAsJsx(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.js"],
    include: ["tests/**/*.{test,spec}.{js,jsx}"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "json-summary", "html"],
      reportsDirectory: "./coverage",
      // Scope to modules exercised by the evaluation suite (lib / hooks / context).
      include: [
        "lib/**/*.{js,jsx}",
        "hooks/**/*.{js,jsx}",
        "context/**/*.{js,jsx}",
      ],
      exclude: [
        "node_modules/**",
        "tests/**",
        "**/*.test.{js,jsx}",
        "**/*.spec.{js,jsx}",
        "lib/logoFont.js",
        "lib/supabase.js",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
