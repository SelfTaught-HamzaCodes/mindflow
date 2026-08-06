import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");

const ROUTES = [
  { route: "/", file: "app/page.js" },
  { route: "/inbox", file: "app/inbox/page.js" },
  { route: "/tasks", file: "app/tasks/page.js" },
  { route: "/compose", file: "app/compose/page.js" },
  { route: "/analytics", file: "app/analytics/page.js" },
  { route: "/reflection", file: "app/reflection/page.js" },
];

describe("Routing (App Router pages)", () => {
  it.each(ROUTES)(
    "exposes route $route via $file with a default export",
    ({ file }) => {
      const abs = path.join(root, file);
      expect(existsSync(abs)).toBe(true);
      const source = readFileSync(abs, "utf8");
      expect(source).toMatch(/export\s+default\s+/);
    },
  );

  it("registers a root layout that wraps the application shell", () => {
    const layout = readFileSync(path.join(root, "app/layout.js"), "utf8");
    expect(layout).toMatch(/export\s+default\s+/);
    expect(layout).toMatch(/children/);
  });

  it("Sidebar navigation targets match implemented routes", () => {
    const sidebar = readFileSync(
      path.join(root, "components/layout/Sidebar.js"),
      "utf8",
    );
    for (const { route } of ROUTES) {
      // href="/" appears as href="/" or href={'/'} etc.
      expect(sidebar).toContain(`"${route}"`);
    }
  });
});
