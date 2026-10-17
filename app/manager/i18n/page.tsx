"use client";

import React, { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Plus, RefreshCw, UploadCloud, RotateCcw, History, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Can } from "@/lib/authz/client";
import { useTranslations } from "next-intl";

interface TranslationValueItem {
  id: string;
  keyId: string;
  locale: string;
  value: string;
  baseValue: string | null;
  status: "DRAFT" | "PUBLISHED" | "NEEDS_REVIEW";
  publishedValue: string | null;
}

interface TranslationKeyItem {
  id: string;
  namespace: string;
  key: string;
  description: string | null;
  source: "CODE" | "DB";
  status: "ACTIVE" | "DEPRECATED";
  tier: "SHARED" | "FEATURE";
  kind: "BUTTON" | "LABEL" | "TITLE" | "MESSAGE" | "ERROR" | "HELP";
  maxLength: number | null;
  values: TranslationValueItem[];
}

export default function I18nManagerPage() {
  const t = useTranslations("admin_i18n");
  const [keys, setKeys] = useState<TranslationKeyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Local editing states
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // History dialog state
  const [historyKey, setHistoryKey] = useState<any | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // New key dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [newNamespace, setNewNamespace] = useState("main/common");
  const [newKeyName, setNewKeyName] = useState("");
  const [newKind, setNewKind] = useState("MESSAGE");
  const [newTier, setNewTier] = useState<"SHARED" | "FEATURE">("FEATURE");
  const [newVi, setNewVi] = useState("");
  const [newEn, setNewEn] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
      });
      if (search.trim()) params.set("q", search.trim());

      const res = await fetch(`/api/manager/i18n/keys?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load keys");
      const json = await res.json();
      if (json?.data) {
        setKeys(json.data || []);
        setTotal(json.meta?.pagination?.total || 0);

        const edits: Record<string, string> = {};
        for (const k of json.data || []) {
          for (const v of k.values) {
            edits[v.id] = v.value;
          }
        }
        setEditingValues(edits);
      }
    } catch {
      toast.error(t("toast_save_failed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void fetchData();
  };

  const handleSaveDraft = async (valueId: string) => {
    const val = editingValues[valueId];
    if (val === undefined) return;

    try {
      setSavingId(valueId);
      const res = await fetch(`/api/manager/i18n/values/${valueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: val, status: "DRAFT" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save draft");
      }
      toast.success(t("toast_saved"));
      void fetchData();
    } catch (e: any) {
      toast.error(e.message || t("toast_save_failed"));
    } finally {
      setSavingId(null);
    }
  };

  const handlePublishAll = async () => {
    try {
      startTransition(async () => {
        const res = await fetch("/api/manager/i18n/publish", { method: "POST" });
        if (!res.ok) throw new Error("Publish failed");
        toast.success(t("toast_published"));
        void fetchData();
      });
    } catch {
      toast.error("Publish failed");
    }
  };

  const handleReset = async (keyId: string) => {
    try {
      const res = await fetch(`/api/manager/i18n/keys/${keyId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Reset failed");
      toast.success(t("toast_reset"));
      void fetchData();
    } catch {
      toast.error("Reset failed");
    }
  };

  const handleOpenHistory = async (keyId: string) => {
    try {
      const res = await fetch(`/api/manager/i18n/keys/${keyId}/history`);
      if (!res.ok) throw new Error("Failed to load history");
      const json = await res.json();
      setHistoryKey(json.data);
      setHistoryOpen(true);
    } catch {
      toast.error("Failed to load history");
    }
  };

  const handleCreateKey = async () => {
    try {
      const res = await fetch("/api/manager/i18n/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namespace: newNamespace,
          key: newKeyName,
          kind: newKind,
          tier: newTier,
          values: {
            vi: newVi,
            en: newEn,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create key");
      }

      toast.success(t("toast_created"));
      setAddOpen(false);
      setNewKeyName("");
      setNewVi("");
      setNewEn("");
      void fetchData();
    } catch (e: any) {
      toast.error(e.message || "Create key failed");
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void fetchData()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {t("refresh")}
          </Button>
          <Can permission="platform:i18n:publish">
            <Button size="sm" variant="default" onClick={() => void handlePublishAll()} disabled={isPending}>
              <UploadCloud className="mr-2 h-4 w-4" />
              {isPending ? t("publishing") : t("publish_all")}
            </Button>
          </Can>
          <Can permission="platform:i18n:create">
            <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("new_key")}
            </Button>
          </Can>
        </div>
      </div>

      <Card>
        <CardHeader>
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <Input
              placeholder={t("search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
            <Button type="submit" variant="outline" size="sm">
              Tìm kiếm
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[240px]">{t("col_key")}</TableHead>
                  <TableHead className="w-[140px]">{t("col_type")}</TableHead>
                  <TableHead className="w-[320px]">{t("col_vi")}</TableHead>
                  <TableHead className="w-[320px]">{t("col_en")}</TableHead>
                  <TableHead className="text-right">{t("col_actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => {
                  const viVal = k.values.find((v) => v.locale === "vi");
                  const enVal = k.values.find((v) => v.locale === "en");

                  return (
                    <TableRow key={k.id}>
                      <TableCell>
                        <div className="font-mono text-xs font-semibold text-primary">{k.key}</div>
                        <div className="text-xs text-muted-foreground">{k.namespace}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <Badge variant={k.tier === "SHARED" ? "default" : "outline"} className="text-[10px]">
                            {k.tier === "SHARED" ? t("badge_shared") : t("badge_feature")}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">{k.kind}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {viVal && (
                          <div className="space-y-1.5">
                            <Textarea
                              rows={2}
                              value={editingValues[viVal.id] ?? viVal.value}
                              onChange={(e) =>
                                setEditingValues({ ...editingValues, [viVal.id]: e.target.value })
                              }
                              className="text-xs resize-y"
                            />
                            <div className="flex items-center justify-between">
                              <Badge
                                variant={
                                  viVal.status === "DRAFT"
                                    ? "secondary"
                                    : viVal.status === "NEEDS_REVIEW"
                                    ? "destructive"
                                    : "outline"
                                }
                                className="text-[10px]"
                              >
                                {viVal.status === "DRAFT"
                                  ? t("badge_draft")
                                  : viVal.status === "NEEDS_REVIEW"
                                  ? t("badge_review")
                                  : t("badge_published")}
                              </Badge>
                              {editingValues[viVal.id] !== viVal.value && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => void handleSaveDraft(viVal.id)}
                                  disabled={savingId === viVal.id}
                                >
                                  {savingId === viVal.id ? t("saving") : t("save_draft")}
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {enVal && (
                          <div className="space-y-1.5">
                            <Textarea
                              rows={2}
                              value={editingValues[enVal.id] ?? enVal.value}
                              onChange={(e) =>
                                setEditingValues({ ...editingValues, [enVal.id]: e.target.value })
                              }
                              className="text-xs resize-y"
                            />
                            <div className="flex items-center justify-between">
                              <Badge
                                variant={
                                  enVal.status === "DRAFT"
                                    ? "secondary"
                                    : enVal.status === "NEEDS_REVIEW"
                                    ? "destructive"
                                    : "outline"
                                }
                                className="text-[10px]"
                              >
                                {enVal.status === "DRAFT"
                                  ? t("badge_draft")
                                  : enVal.status === "NEEDS_REVIEW"
                                  ? t("badge_review")
                                  : t("badge_published")}
                              </Badge>
                              {editingValues[enVal.id] !== enVal.value && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => void handleSaveDraft(enVal.id)}
                                  disabled={savingId === enVal.id}
                                >
                                  {savingId === enVal.id ? t("saving") : t("save_draft")}
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void handleOpenHistory(k.id)}
                            title={t("history")}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Can permission="platform:i18n:delete">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => void handleReset(k.id)}
                              title={t("reset_default")}
                            >
                              <RotateCcw className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </Can>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog History */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("history_title")}: {historyKey?.key}</DialogTitle>
            <DialogDescription>{t("history_desc")}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-4">
            {historyKey?.values?.map((val: any) => (
              <div key={val.id} className="border rounded-md p-3 space-y-2">
                <div className="font-semibold text-xs flex items-center justify-between">
                  <span>Locale: {val.locale}</span>
                  <span className="text-muted-foreground font-normal">Base: {val.baseValue || "(None)"}</span>
                </div>
                <div className="space-y-1">
                  {val.revisions?.map((rev: any) => (
                    <div key={rev.id} className="text-xs border-t pt-1 flex justify-between items-center">
                      <div>
                        <Badge variant="outline" className="mr-1.5 text-[9px]">{rev.action}</Badge>
                        <span className="font-mono text-muted-foreground line-through mr-1.5">{rev.oldValue}</span>
                        <span className="font-mono text-primary font-medium">{rev.newValue}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{new Date(rev.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                  {(!val.revisions || val.revisions.length === 0) && (
                    <div className="text-xs text-muted-foreground">{t("no_history")}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Add Key */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dialog_add_title")}</DialogTitle>
            <DialogDescription>{t("dialog_add_desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">{t("field_namespace")}</label>
              <Input
                value={newNamespace}
                onChange={(e) => setNewNamespace(e.target.value)}
                placeholder="main/common"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium">{t("field_key")}</label>
              <Input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="action.save"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium">{t("field_kind")}</label>
                <Select value={newKind} onValueChange={setNewKind}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUTTON">BUTTON</SelectItem>
                    <SelectItem value="LABEL">LABEL</SelectItem>
                    <SelectItem value="TITLE">TITLE</SelectItem>
                    <SelectItem value="MESSAGE">MESSAGE</SelectItem>
                    <SelectItem value="ERROR">ERROR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">{t("field_tier")}</label>
                <Select value={newTier} onValueChange={(v: any) => setNewTier(v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FEATURE">FEATURE</SelectItem>
                    <SelectItem value="SHARED">SHARED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">Tiếng Việt (vi)</label>
              <Input
                value={newVi}
                onChange={(e) => setNewVi(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium">English (en)</label>
              <Input
                value={newEn}
                onChange={(e) => setNewEn(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>{t("btn_cancel")}</Button>
            <Button onClick={() => void handleCreateKey()}>{t("btn_save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

