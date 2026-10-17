import type { AuthzSubject } from "./types";
import { can } from "./policy";

export function getShopScopeWhere(
  subject: AuthzSubject,
  targetShopId: string,
  permission: string
): { shopId: string } | null {
  const allowed = can(subject, permission, { targetShopId });
  if (!allowed) {
    return null;
  }
  return { shopId: targetShopId };
}

export function getUserScopeWhere(
  subject: AuthzSubject,
  permission: string
): { id?: string } | Record<string, never> | null {
  const hasGlobal = can(subject, permission);
  if (hasGlobal) {
    return {};
  }

  const hasOwn = can(subject, permission, { resourceOwnerId: subject.userId });
  if (hasOwn) {
    return { id: subject.userId };
  }

  return null;
}

