import { describe, expect, it } from "vitest";
import { can, canAll, canAny, matchesPermissionPattern } from "@/lib/authz/policy";
import type { AuthzSubject } from "@/lib/authz/types";

describe("lib/authz/policy", () => {
  describe("matchesPermissionPattern", () => {
    it("matches exact permission strings", () => {
      expect(matchesPermissionPattern("shop:products:read", "shop:products:read")).toBe(true);
      expect(matchesPermissionPattern("shop:products:read", "shop:products:write")).toBe(false);
    });

    it("matches global wildcard *", () => {
      expect(matchesPermissionPattern("*", "anything:at:all")).toBe(true);
      expect(matchesPermissionPattern("*", "platform:admin:access")).toBe(true);
    });

    it("matches prefix wildcard with :*", () => {
      expect(matchesPermissionPattern("shop:*", "shop:products:read")).toBe(true);
      expect(matchesPermissionPattern("shop:*", "shop:orders:process")).toBe(true);
      expect(matchesPermissionPattern("shop:*", "platform:shops:read")).toBe(false);
    });
  });

  describe("can() evaluation", () => {
    const mockSubject: AuthzSubject = {
      userId: "user-1",
      email: "staff@shop.com",
      authzVersion: 1,
      roles: [
        {
          roleId: "role-1",
          roleKey: "shop_staff",
          roleName: "Shop Staff",
          scope: "SHOP",
          shopId: "shop-abc",
        },
      ],
      rules: [
        {
          key: "shop:products:read",
          scope: "SHOP",
          effect: "ALLOW",
          shopId: "shop-abc",
        },
        {
          key: "shop:orders:read",
          scope: "SHOP",
          effect: "ALLOW",
          shopId: "shop-abc",
        },
        {
          key: "shop:orders:process",
          scope: "SHOP",
          effect: "DENY",
          shopId: "shop-abc",
        },
      ],
    };

    it("returns false for null or undefined subject", () => {
      expect(can(null, "shop:products:read")).toBe(false);
      expect(can(undefined, "shop:products:read")).toBe(false);
    });

    it("allows permission present in subject rules for matching shopId", () => {
      expect(can(mockSubject, "shop:products:read", { targetShopId: "shop-abc" })).toBe(true);
    });

    it("denies when targetShopId does not match the rule shopId", () => {
      expect(can(mockSubject, "shop:products:read", { targetShopId: "shop-other" })).toBe(false);
    });

    it("denies by default if targetShopId is missing for shop-scoped rule", () => {
      expect(can(mockSubject, "shop:products:read")).toBe(false);
    });

    it("prioritizes DENY over ALLOW for the same permission", () => {
      expect(can(mockSubject, "shop:orders:process", { targetShopId: "shop-abc" })).toBe(false);
    });

    it("denies ungranted permissions by default", () => {
      expect(can(mockSubject, "shop:products:delete", { targetShopId: "shop-abc" })).toBe(false);
    });
  });

  describe("can() with superadmin and wildcards", () => {
    const superAdmin: AuthzSubject = {
      userId: "admin-1",
      email: "admin@platform.com",
      authzVersion: 1,
      roles: [
        {
          roleId: "role-super",
          roleKey: "super_admin",
          roleName: "Super Admin",
          scope: "PLATFORM",
          shopId: null,
        },
      ],
      rules: [
        {
          key: "*",
          scope: "PLATFORM",
          effect: "ALLOW",
          shopId: null,
        },
      ],
    };

    it("allows any platform permission for superadmin", () => {
      expect(can(superAdmin, "platform:admin:access")).toBe(true);
      expect(can(superAdmin, "platform:roles:write")).toBe(true);
      expect(can(superAdmin, "any:custom:permission")).toBe(true);
    });

    it("allows shop action if explicit DENY is not present", () => {
      expect(can(superAdmin, "shop:orders:process", { targetShopId: "shop-xyz" })).toBe(true);
    });

    it("denies if an explicit DENY override exists even with wildcard ALLOW", () => {
      const restrictedAdmin: AuthzSubject = {
        ...superAdmin,
        rules: [
          ...superAdmin.rules,
          {
            key: "platform:roles:write",
            scope: "PLATFORM",
            effect: "DENY",
          },
        ],
      };

      expect(can(restrictedAdmin, "platform:users:read")).toBe(true);
      expect(can(restrictedAdmin, "platform:roles:write")).toBe(false);
    });
  });

  describe("canAny and canAll", () => {
    const subject: AuthzSubject = {
      userId: "user-test",
      authzVersion: 1,
      roles: [],
      rules: [
        { key: "perm:a", scope: "PLATFORM", effect: "ALLOW" },
        { key: "perm:b", scope: "PLATFORM", effect: "ALLOW" },
      ],
    };

    it("canAny returns true if at least one permission matches", () => {
      expect(canAny(subject, ["perm:a", "perm:c"])).toBe(true);
      expect(canAny(subject, ["perm:x", "perm:y"])).toBe(false);
    });

    it("canAll returns true only if all permissions match", () => {
      expect(canAll(subject, ["perm:a", "perm:b"])).toBe(true);
      expect(canAll(subject, ["perm:a", "perm:c"])).toBe(false);
    });
  });
});

