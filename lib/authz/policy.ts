import type {
  AuthzContext,
  AuthzSubject,
  PermissionCondition,
  ResolvedPermissionRule,
} from "./types";

export function matchesPermissionPattern(pattern: string, requested: string): boolean {
  if (pattern === requested) return true;
  if (pattern === "*") return true;

  if (pattern.endsWith(":*")) {
    const prefix = pattern.slice(0, -2);
    return requested === prefix || requested.startsWith(`${prefix}:`);
  }

  return false;
}

export function evaluateCondition(
  condition: PermissionCondition,
  subject: AuthzSubject,
  context?: AuthzContext
): boolean {
  if (!condition) return true;

  if (condition.matchContext === "userId") {
    const targetUserId = context?.resourceOwnerId ?? context?.userId;
    if (targetUserId !== undefined && targetUserId !== subject.userId) {
      return false;
    }
  }

  if (condition.matchContext === "shopId") {
    const targetShopId = context?.targetShopId ?? context?.shopId;
    if (condition.field && context && context[condition.field] !== undefined) {
      const fieldVal = context[condition.field];
      if (condition.op === "eq" && fieldVal !== condition.value) return false;
      if (condition.op === "ne" && fieldVal === condition.value) return false;
    }
    if (targetShopId !== undefined && condition.value !== undefined && targetShopId !== condition.value) {
      return false;
    }
  }

  if (condition.field && context && context[condition.field] !== undefined) {
    const val = context[condition.field];
    switch (condition.op) {
      case "eq":
        return val === condition.value;
      case "ne":
        return val !== condition.value;
      case "in":
        return Array.isArray(condition.value) && condition.value.includes(val);
      case "contains":
        return Array.isArray(val) && val.includes(condition.value);
      default:
        return true;
    }
  }

  return true;
}

export function evaluateRuleScope(
  rule: ResolvedPermissionRule,
  context?: AuthzContext
): boolean {
  if (rule.scope === "PLATFORM") {
    return true;
  }

  if (rule.scope === "SHOP") {
    if (!context?.targetShopId) {
      return false;
    }
    if (rule.shopId && rule.shopId !== context.targetShopId) {
      return false;
    }
    return true;
  }

  return true;
}

export function can(
  subject: AuthzSubject | null | undefined,
  requestedPermission: string,
  context?: AuthzContext
): boolean {
  if (!subject) return false;

  const applicableRules: ResolvedPermissionRule[] = [];

  for (const rule of subject.rules) {
    if (!matchesPermissionPattern(rule.key, requestedPermission)) {
      continue;
    }

    if (!evaluateRuleScope(rule, context)) {
      continue;
    }

    if (rule.conditions && rule.conditions.length > 0) {
      const conditionsPass = rule.conditions.every((cond) =>
        evaluateCondition(cond, subject, context)
      );
      if (!conditionsPass) {
        continue;
      }
    }

    applicableRules.push(rule);
  }

  const hasDeny = applicableRules.some((r) => r.effect === "DENY");
  if (hasDeny) {
    return false;
  }

  const hasAllow = applicableRules.some((r) => r.effect === "ALLOW");
  return hasAllow;
}

export function canAny(
  subject: AuthzSubject | null | undefined,
  requestedPermissions: string[],
  context?: AuthzContext
): boolean {
  if (!subject || requestedPermissions.length === 0) return false;
  return requestedPermissions.some((perm) => can(subject, perm, context));
}

export function canAll(
  subject: AuthzSubject | null | undefined,
  requestedPermissions: string[],
  context?: AuthzContext
): boolean {
  if (!subject || requestedPermissions.length === 0) return false;
  return requestedPermissions.every((perm) => can(subject, perm, context));
}

