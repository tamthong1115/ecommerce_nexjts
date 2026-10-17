import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Security Route & Action Audit Scanner", () => {
  const routesDir = path.resolve(__dirname, "../../app/api");

  function getRouteFiles(dir: string): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        results.push(...getRouteFiles(fullPath));
      } else if (item.name === "route.ts" || item.name === "route.js") {
        results.push(fullPath);
      }
    }
    return results;
  }

  it("ensures all /manager API routes are protected with withAdmin or withPermission", () => {
    const allRoutes = getRouteFiles(routesDir);
    const managerRoutes = allRoutes.filter((file) => file.includes(`${path.sep}manager${path.sep}`));

    expect(managerRoutes.length).toBeGreaterThan(0);

    const unprotected: string[] = [];

    for (const routePath of managerRoutes) {
      const content = fs.readFileSync(routePath, "utf-8");
      const isProtected =
        content.includes("withAdmin") ||
        content.includes("withPermission") ||
        content.includes("withAuth");

      if (!isProtected) {
        unprotected.push(routePath);
      }
    }

    expect(unprotected).toEqual([]);
  });

  it("ensures all /seller API routes are guarded with auth checks", () => {
    const allRoutes = getRouteFiles(routesDir);
    const sellerRoutes = allRoutes.filter((file) => file.includes(`${path.sep}seller${path.sep}`));

    expect(sellerRoutes.length).toBeGreaterThan(0);

    const unprotected: string[] = [];

    for (const routePath of sellerRoutes) {
      const content = fs.readFileSync(routePath, "utf-8");
      const isProtected =
        content.includes("requireSeller") ||
        content.includes("withPermission") ||
        content.includes("withAuth") ||
        content.includes("getSessionUser") ||
        content.includes("auth.api.getSession");

      if (!isProtected) {
        unprotected.push(routePath);
      }
    }

    expect(unprotected).toEqual([]);
  });
});

