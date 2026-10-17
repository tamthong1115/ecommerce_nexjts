"use client";

import React from "react";
import { usePermissions } from "./permissions-context";
import type { AuthzContext } from "@/lib/authz/types";

export interface CanProps {
  permission?: string;
  anyPermissions?: string[];
  allPermissions?: string[];
  context?: AuthzContext;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function Can({
  permission,
  anyPermissions,
  allPermissions,
  context,
  fallback = null,
  children,
}: CanProps) {
  const { can, canAny, canAll, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  let allowed = true;

  if (permission && !can(permission, context)) {
    allowed = false;
  }

  if (allowed && anyPermissions && anyPermissions.length > 0 && !canAny(anyPermissions, context)) {
    allowed = false;
  }

  if (allowed && allPermissions && allPermissions.length > 0 && !canAll(allPermissions, context)) {
    allowed = false;
  }

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

