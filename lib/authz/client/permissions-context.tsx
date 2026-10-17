"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import type { AuthzContext, AuthzSubject } from "@/lib/authz/types";
import { can as evaluateCan, canAll as evaluateCanAll, canAny as evaluateCanAny } from "@/lib/authz/policy";

interface PermissionsContextValue {
  subject: AuthzSubject | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  can: (permission: string, context?: AuthzContext) => boolean;
  canAny: (permissions: string[], context?: AuthzContext) => boolean;
  canAll: (permissions: string[], context?: AuthzContext) => boolean;
  hasRole: (roleKey: string, shopId?: string | null) => boolean;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  subject: null,
  isLoading: true,
  refresh: async () => {},
  can: () => false,
  canAny: () => false,
  canAll: () => false,
  hasRole: () => false,
});

export interface PermissionsProviderProps {
  children: React.ReactNode;
  initialSubject?: AuthzSubject | null;
}

export function PermissionsProvider({
  children,
  initialSubject = null,
}: PermissionsProviderProps) {
  const [subject, setSubject] = useState<AuthzSubject | null>(initialSubject);
  const [isLoading, setIsLoading] = useState<boolean>(!initialSubject);

  const fetchSubject = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/permissions");
      if (!res.ok) {
        setSubject(null);
        return;
      }
      const json = await res.json();
      if (json?.data) {
        setSubject(json.data as AuthzSubject);
      } else {
        setSubject(null);
      }
    } catch {
      setSubject(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialSubject) {
      void fetchSubject();
    }
  }, [initialSubject]);

  const value = useMemo<PermissionsContextValue>(() => {
    return {
      subject,
      isLoading,
      refresh: fetchSubject,
      can: (perm: string, ctx?: AuthzContext) => evaluateCan(subject, perm, ctx),
      canAny: (perms: string[], ctx?: AuthzContext) => evaluateCanAny(subject, perms, ctx),
      canAll: (perms: string[], ctx?: AuthzContext) => evaluateCanAll(subject, perms, ctx),
      hasRole: (roleKey: string, shopId?: string | null) => {
        if (!subject) return false;
        return subject.roles.some((r) => {
          if (r.roleKey !== roleKey) return false;
          if (shopId !== undefined && r.shopId !== shopId) return false;
          return true;
        });
      },
    };
  }, [subject, isLoading]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextValue {
  return useContext(PermissionsContext);
}

