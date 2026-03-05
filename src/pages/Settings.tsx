import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Link2, CheckCircle2, RefreshCw, Building2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/use-tenant";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";

const SettingsPage = () => {
  const { tenantId, tenantName, loading: tenantLoading } = useTenant();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [waAccounts, setWaAccounts] = useState<any[]>([]);
  const [loadingWa, setLoadingWa] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  // Link WA account form
  const [waLabel, setWaLabel] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [linking, setLinking] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => { setName(tenantName || ""); }, [tenantName]);

  const fetchWaAccounts = async () => {
    if (!tenantId) return;
    setLoadingWa(true);
    const { data } = await supabase
      .from("wa_accounts")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true });
    setWaAccounts(data || []);
    setLoadingWa(false);
  };

  useEffect(() => { fetchWaAccounts(); }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    await supabase.from("tenants").update({ name }).eq("id", tenantId);
    setSaving(false);
    toast({ title: "تم حفظ الإعدادات" });
  };

  const handleLinkWaAccount = async () => {
    if (!tenantId || !wabaId.trim() || !waLabel.trim()) return;
    setLinking(true);
    const { error } = await supabase.from("wa_accounts").insert({
      tenant_id: tenantId,
      waba_id: wabaId.trim(),
      label: waLabel.trim(),
    });
    setLinking(false);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم ربط حساب واتساب بنجاح" });
      setDialogOpen(false);
      setWaLabel("");
      setWabaId("");
      fetchWaAccounts();
    }
  };

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
        title: "تمت المزامنة بنجاح",
        description: `${data.wabas_synced} حساب · ${data.numbers_synced} رقم · ${data.templates_synced} قالب`,
      });
      fetchWaAccounts();
    }
  };

  if (tenantLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader title="الإعدادات" description="إعدادات النظام والتفضيلات" />

      <Tabs defaultValue="general" className="animate-fade-in">
        <TabsList className="mb-6">
          <TabsTrigger value="general">عام</TabsTrigger>
          <TabsTrigger value="accounts">حسابات واتساب ({waAccounts.length})</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="bg-card rounded-xl border border-border p-6 space-y-6 max-w-2xl">
            <div>
              <Label className="text-sm font-medium">اسم المؤسسة</Label>
              <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium">البريد الإلكتروني</Label>
              <Input className="mt-1.5" value={user?.email || ""} dir="ltr" readOnly />
            </div>
            <div>
              <Label className="text-sm font-medium">معرف المؤسسة</Label>
              <Input className="mt-1.5" value={tenantId || ""} dir="ltr" readOnly />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}حفظ التغييرات
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="accounts">
          <div className="space-y-6 max-w-3xl">
            {/* Header with actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="outline" className="gap-2" onClick={handleSyncAll} disabled={syncing}>
                <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                مزامنة من Meta
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    ربط حساب يدوياً
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>ربط حساب واتساب للأعمال</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label className="text-sm font-medium">اسم الحساب</Label>
                      <Input className="mt-1.5" placeholder="مثال: حساب الشركة الرئيسي" value={waLabel} onChange={(e) => setWaLabel(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">معرف حساب الأعمال (WABA ID)</Label>
                      <Input className="mt-1.5" placeholder="مثال: 123456789012345" dir="ltr" value={wabaId} onChange={(e) => setWabaId(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                    <Button onClick={handleLinkWaAccount} disabled={linking || !wabaId.trim() || !waLabel.trim()}>
                      {linking && <Loader2 className="w-4 h-4 animate-spin ml-2" />}ربط الحساب
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <span className="text-xs text-muted-foreground mr-auto">
                {syncing ? "جارٍ مزامنة كل الحسابات والأرقام والقوالب..." : `${waAccounts.length} حساب مربوط`}
              </span>
            </div>

            {/* Accounts list */}
            {loadingWa ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : waAccounts.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
                <p className="font-medium">لم يتم ربط أي حساب واتساب بعد</p>
                <p className="text-sm text-muted-foreground mt-1">اضغط «مزامنة من Meta» لسحب جميع الحسابات تلقائياً</p>
              </div>
            ) : (
              <div className="space-y-3">
                {waAccounts.map((acc) => (
                  <div key={acc.id} className="bg-card rounded-xl border border-border p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[hsl(var(--chart-2)/0.1)] flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-[hsl(var(--chart-2))]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{acc.label}</p>
                        <p className="text-xs text-muted-foreground font-mono" dir="ltr">WABA: {acc.waba_id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">معرف الحساب الداخلي</Label>
                        <p className="text-xs font-mono mt-0.5" dir="ltr">{acc.id}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">تاريخ الربط</Label>
                        <p className="text-xs mt-0.5">{new Date(acc.created_at).toLocaleDateString("ar")}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="api">
          <div className="bg-card rounded-xl border border-border p-6 space-y-4 max-w-2xl">
            <div>
              <Label className="text-sm font-medium">إصدار API</Label>
              <Input className="mt-1.5" defaultValue="v24.0" dir="ltr" readOnly />
            </div>
            <div>
              <Label className="text-sm font-medium">Business ID</Label>
              <Input className="mt-1.5" defaultValue="314437023701205" dir="ltr" readOnly />
            </div>
            <div>
              <Label className="text-sm font-medium">عدد الحسابات المربوطة</Label>
              <Input className="mt-1.5" value={`${waAccounts.length} حساب`} readOnly />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default SettingsPage;
