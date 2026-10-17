"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Key, Plus, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Can } from "@/lib/authz/client";
import { useTranslations } from "next-intl";

interface PermissionItem {
  id: string;
  key: string;
  displayName: string | null;
  module: string | null;
  scope: string;
}

interface RoleItem {
  id: string;
  key: string;
  name: string;
  description: string | null;
  scope: string;
  isSystem: boolean;
  rolePermissions: { permission: PermissionItem }[];
  _count: { userRoles: number };
}

export default function AccessControlPage() {
  const t = useTranslations("admin_access");
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccessData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/manager/roles");
      if (!res.ok) {
        throw new Error("Failed to fetch roles and permissions");
      }
      const json = await res.json();
      if (json?.data) {
        setRoles(json.data.roles || []);
        setPermissions(json.data.permissions || []);
      }
    } catch {
      toast.error(t("load_error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAccessData();
  }, []);

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void fetchAccessData()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {t("refresh")}
          </Button>
          <Can permission="platform:roles:write">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t("create_role")}
            </Button>
          </Can>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {t("roles_title")} ({roles.length})
            </CardTitle>
            <CardDescription>{t("roles_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("role_code_name")}</TableHead>
                  <TableHead>{t("scope")}</TableHead>
                  <TableHead>{t("permissions_count")}</TableHead>
                  <TableHead>{t("users_count")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="font-medium flex items-center gap-1.5">
                        {role.name}
                        {role.isSystem && (
                          <Badge variant="outline" className="text-xs">{t("system_badge")}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{role.key}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{role.scope}</Badge>
                    </TableCell>
                    <TableCell>{role.rolePermissions.length}</TableCell>
                    <TableCell>{role._count.userRoles}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              {t("permissions_title")} ({permissions.length})
            </CardTitle>
            <CardDescription>{t("permissions_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("perm_key")}</TableHead>
                  <TableHead>{t("perm_name")}</TableHead>
                  <TableHead>{t("module")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((perm) => (
                  <TableRow key={perm.id}>
                    <TableCell className="font-mono text-xs">{perm.key}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        {perm.displayName || perm.key}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{perm.module || "core"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

