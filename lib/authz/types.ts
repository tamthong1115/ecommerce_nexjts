import type { PermissionEffect, PermissionScope } from "@/lib/generated/prisma";

export type AuthzScope = PermissionScope;
export type AuthzEffect = PermissionEffect;

export interface PermissionCondition {
  field?: string;
  op?: "eq" | "in" | "ne" | "contains";
  value?: unknown;
  matchContext?: "userId" | "shopId";
}

export interface ResolvedPermissionRule {
  key: string;
  scope: AuthzScope;
  effect: AuthzEffect;
  shopId?: string | null;
  conditions?: PermissionCondition[] | null;
}

export interface AuthzRoleAssignment {
  roleId: string;
  roleKey: string;
  roleName: string;
  scope: AuthzScope;
  shopId?: string | null;
}

export interface AuthzSubject {
  userId: string;
  email?: string | null;
  authzVersion: number;
  roles: AuthzRoleAssignment[];
  rules: ResolvedPermissionRule[];
}

export interface AuthzContext {
  targetShopId?: string | null;
  resourceOwnerId?: string | null;
  [key: string]: unknown;
}

export interface PermissionDefinition {
  key: string;
  displayName: string;
  description: string;
  module: string;
  scope: AuthzScope;
  riskLevel?: "low" | "medium" | "high" | "critical";
}

export interface RoleDefinition {
  code: string;
  name: string;
  description: string;
  scope: AuthzScope;
  isSystem: boolean;
  permissions: string[];
}
