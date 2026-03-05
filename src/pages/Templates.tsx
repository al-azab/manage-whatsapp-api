import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { SendTemplateModal } from "@/components/SendTemplateModal";
import {
  Search, RefreshCw, FileText, Loader2, Plus, Send, MoreHorizontal, Copy, Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/use-tenant";
import { useToast } from "@/hooks/use-toast";

/* ───────── helpers ───────── */
const statusStyle: Record<string, string> = {
  APPROVED: "bg-[hsl(var(--chart-2)/0.12)] text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2)/0.25)]",
  PENDING:  "bg-[hsl(var(--chart-4)/0.12)] text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4)/0.25)]",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/25",
  PAUSED:   "bg-[hsl(var(--chart-4)/0.12)] text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4)/0.25)]",
};

const statusLabel: Record<string, string> = {
  APPROVED: "موافق عليه", PENDING: "قيد المراجعة", REJECTED: "مرفوض", PAUSED: "متوقف",
};

const categoryLabel: Record<string, string> = {
  UTILITY: "خدمي", MARKETING: "تسويقي", AUTH: "مصادقة",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle[status] || "bg-muted text-muted-foreground border-border"}`}>
      {statusLabel[status] || status}
    </span>
  );
}

function paramsCount(t: any): number {
  const vars = t.variables;
  if (Array.isArray(vars)) return vars.length;
  return 0;
}

/* ───────── component ───────── */
const TemplatesPage = () => {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [templates, setTemplates] = useState<any[]>([]);
  const [waAccounts, setWaAccounts] = useState<any[]>([]);
  const [waNumbers, setWaNumbers] = useState<any[]>([]);
  const [accountFilter, setAccountFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [syncing, setSyncing] = useState(false);
  const [sendModal, setSendModal] = useState<{ open: boolean; template: any }>({ open: false, template: null });
  const { toast } = useToast();

  const fetchAll = async () => {
    if (!tenantId) return;
    setLoading(true);

    const [{ data: accounts }, { data: nums }, templateRes] = await Promise.all([
      supabase.from("wa_accounts").select("id,label,waba_id").eq("tenant_id", tenantId),
      supabase.from("wa_numbers").select("id,phone_e164").eq("tenant_id", tenantId),
      (async () => {
        let q = supabase.from("templates").select("*, wa_accounts(label)").eq("tenant_id", tenantId).order("status", { ascending: true }).order("name", { ascending: true });
        if (search) q = q.ilike("name", `%${search}%`);
        if (statusFilter !== "all") q = q.eq("status", statusFilter as any);
        if (categoryFilter !== "all") q = q.eq("category", categoryFilter as any);
        if (accountFilter !== "all") q = q.eq("wa_account_id", accountFilter);
        return q.limit(500);
      })(),
    ]);

    setWaAccounts(accounts || []);
    setWaNumbers(nums || []);
    setTemplates(templateRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [tenantId, search, statusFilter, categoryFilter, accountFilter]);

  const handleSyncAll = async () => {
    if (!tenantId) return;
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke("meta_sync_all", {
      body: { tenant_id: tenantId },
    });
    setSyncing(false);
    if (error) {
      toast({ title: "خطأ في المزامنة", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "تمت المزامنة",
        description: `${data.templates_synced} قالب من ${data.wabas_synced} حساب`,
      });
      fetchAll();
    }
  };

  const handleSend = (t: any) => setSendModal({ open: true, template: t });
  const handleCopy = (t: any) => {
    navigator.clipboard.writeText(t.name);
    toast({ title: "تم نسخ اسم القالب" });
  };
  const handleDelete = async (t: any) => {
    const { error } = await supabase.from("templates").delete().eq("id", t.id);
    if (error) {
      toast({ title: "خطأ في الحذف", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم حذف القالب" });
      fetchAll();
    }
  };

  if (tenantLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader title="قوالب الرسائل" description={`${templates.length} قالب عبر ${waAccounts.length} حساب`}>
        <Button variant="outline" className="gap-2" onClick={handleSyncAll} disabled={syncing}>
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />مزامنة الكل
        </Button>
      </PageHeader>

      {/* Filters bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="بحث في القوالب..." className="pr-9 bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {waAccounts.length > 1 && (
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-48 bg-card"><SelectValue placeholder="كل الحسابات" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحسابات</SelectItem>
              {waAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-card"><SelectValue placeholder="كل الحالات" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="APPROVED">موافق عليه</SelectItem>
            <SelectItem value="PENDING">قيد المراجعة</SelectItem>
            <SelectItem value="REJECTED">مرفوض</SelectItem>
            <SelectItem value="PAUSED">متوقف</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 bg-card"><SelectValue placeholder="كل الفئات" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الفئات</SelectItem>
            <SelectItem value="UTILITY">خدمي</SelectItem>
            <SelectItem value="MARKETING">تسويقي</SelectItem>
            <SelectItem value="AUTH">مصادقة</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground mr-auto">{templates.length} قالب</span>
      </div>

      {/* Table */}
      {templates.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8">
          <EmptyState icon={FileText} title="لا توجد قوالب" description="اضغط «مزامنة الكل» لجلب القوالب من جميع حسابات واتساب" />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">الاسم</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">الحساب</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">الحالة</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">الفئة</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">اللغة</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">معاينة النص</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => {
                const params = paramsCount(t);
                const accLabel = (t.wa_accounts as any)?.label || "—";
                return (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors group">
                    <td className="px-5 py-3">
                      <span className="block text-sm font-semibold text-foreground font-mono" dir="ltr">{t.name}</span>
                      <div className="flex items-center gap-2 mt-0.5" dir="ltr">
                        {params > 0 && <span className="text-xs text-muted-foreground">{params} params</span>}
                        {params > 0 && <span className="text-muted-foreground/40 text-xs">·</span>}
                        <span className="text-xs text-muted-foreground font-mono">{(t.meta?.id as string)?.slice(0, 10) || t.id?.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{accLabel}</td>
                    <td className="px-4 py-3"><StatusPill status={t.status} /></td>
                    <td className="px-4 py-3 text-sm text-foreground">{categoryLabel[t.category] || t.category}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground" dir="ltr">{t.language}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs">
                      <span className="line-clamp-1" dir={t.language?.startsWith("ar") ? "rtl" : "ltr"}>{t.body || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" title="إرسال القالب" onClick={() => handleSend(t)}>
                          <Send className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => handleSend(t)} className="gap-2"><Send className="w-3.5 h-3.5" />إرسال</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopy(t)} className="gap-2"><Copy className="w-3.5 h-3.5" />نسخ الاسم</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(t)} className="gap-2 text-destructive focus:text-destructive"><Trash2 className="w-3.5 h-3.5" />حذف</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tenantId && (
        <SendTemplateModal
          open={sendModal.open}
          onClose={() => setSendModal({ open: false, template: null })}
          template={sendModal.template}
          tenantId={tenantId}
        />
      )}
    </DashboardLayout>
  );
};

export default TemplatesPage;
