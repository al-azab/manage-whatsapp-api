import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Phone, Loader2, Plus, AlertCircle, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/use-tenant";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const statusMap: Record<string, { status: "success" | "danger" | "warning"; label: string }> = {
  active: { status: "success", label: "متصل" },
  connected: { status: "success", label: "متصل" },
  disconnected: { status: "danger", label: "غير متصل" },
  pending: { status: "warning", label: "قيد التفعيل" },
};

const NumbersPage = () => {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [numbers, setNumbers] = useState<any[]>([]);
  const [waAccounts, setWaAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  // Form fields
  const [phoneE164, setPhoneE164] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [numberType, setNumberType] = useState<string>("connected");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const fetchData = async () => {
    if (!tenantId) return;
    setLoading(true);

    const [numbersRes, accountsRes] = await Promise.all([
      supabase.from("wa_numbers").select("*, wa_accounts(label, waba_id)").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
      supabase.from("wa_accounts").select("id, label, waba_id").eq("tenant_id", tenantId),
    ]);

    setNumbers(numbersRes.data || []);
    setWaAccounts(accountsRes.data || []);
    if (accountsRes.data?.length && !selectedAccountId) {
      setSelectedAccountId(accountsRes.data[0].id);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tenantId]);

  const handleAddNumber = async () => {
    if (!tenantId || !selectedAccountId || !phoneE164.trim() || !phoneNumberId.trim()) return;
    setAdding(true);
    const { error } = await supabase.from("wa_numbers").insert({
      tenant_id: tenantId,
      wa_account_id: selectedAccountId,
      phone_e164: phoneE164.trim(),
      phone_number_id: phoneNumberId.trim(),
      type: numberType as any,
      status: "active",
    });
    setAdding(false);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم إضافة الرقم بنجاح" });
      setDialogOpen(false);
      setPhoneE164("");
      setPhoneNumberId("");
      setNumberType("connected");
      fetchData();
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
      toast({ title: "تمت المزامنة", description: `${data.numbers_synced} رقم تم مزامنته` });
      fetchData();
    }
  };

  if (tenantLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  if (waAccounts.length === 0) {
    return (
      <DashboardLayout>
        <PageHeader title="إدارة الأرقام" description="إدارة أرقام واتساب المتصلة والرقمية" />
        <div className="bg-card rounded-xl border border-border p-8 text-center max-w-lg mx-auto mt-8">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-warning opacity-60" />
          <h3 className="text-lg font-semibold mb-2">لم يتم ربط حساب واتساب بعد</h3>
          <p className="text-sm text-muted-foreground mb-4">يجب ربط حساب واتساب للأعمال أولاً أو مزامنة الحسابات من Meta</p>
          <div className="flex gap-2 justify-center">
            <Link to="/settings"><Button>اذهب للإعدادات</Button></Link>
            <Button variant="outline" onClick={handleSyncAll} disabled={syncing} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />مزامنة
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const byType = (type: string) => numbers.filter((n) => n.type === type);

  const renderTable = (items: any[]) => {
    if (items.length === 0) {
      return (
        <div className="bg-card rounded-xl border border-border p-8">
          <EmptyState icon={Phone} title="لا توجد أرقام" description="أضف رقم واتساب جديد أو قم بالمزامنة من Meta" />
        </div>
      );
    }
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-right text-xs font-medium text-muted-foreground p-4">الرقم</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-4">معرف الرقم</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-4">الحساب</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-4">النوع</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-4">الحالة</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-4">تاريخ الإضافة</th>
            </tr>
          </thead>
          <tbody>
            {items.map((num) => {
              const st = statusMap[num.status] || { status: "neutral" as const, label: num.status };
              const accLabel = (num.wa_accounts as any)?.label || "—";
              return (
                <tr key={num.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="p-4 text-sm font-medium" dir="ltr">{num.phone_e164}</td>
                  <td className="p-4 text-sm font-mono text-muted-foreground" dir="ltr">{num.phone_number_id}</td>
                  <td className="p-4 text-sm text-muted-foreground">{accLabel}</td>
                  <td className="p-4 text-sm">{num.type === "connected" ? "متصل" : num.type === "digital" ? "رقمي" : "اختبار"}</td>
                  <td className="p-4"><StatusBadge status={st.status} label={st.label} /></td>
                  <td className="p-4 text-sm text-muted-foreground">{new Date(num.created_at).toLocaleDateString("ar")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="إدارة الأرقام" description={`${numbers.length} رقم عبر ${waAccounts.length} حساب`} />
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleSyncAll} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />مزامنة
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 ml-2" />إضافة رقم</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>إضافة رقم واتساب جديد</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-sm font-medium">الحساب</Label>
                  <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="اختر الحساب" /></SelectTrigger>
                    <SelectContent>
                      {waAccounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.label} ({a.waba_id})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">رقم الهاتف (بالصيغة الدولية)</Label>
                  <Input className="mt-1.5" placeholder="مثال: +966501234567" dir="ltr" value={phoneE164} onChange={(e) => setPhoneE164(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-medium">معرف رقم الهاتف (Phone Number ID)</Label>
                  <Input className="mt-1.5" placeholder="مثال: 123456789012345" dir="ltr" value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-medium">نوع الرقم</Label>
                  <Select value={numberType} onValueChange={setNumberType}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="connected">متصل (Connected)</SelectItem>
                      <SelectItem value="digital">رقمي (Digital)</SelectItem>
                      <SelectItem value="sandbox">اختبار (Sandbox)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                <Button onClick={handleAddNumber} disabled={adding || !phoneE164.trim() || !phoneNumberId.trim() || !selectedAccountId}>
                  {adding && <Loader2 className="w-4 h-4 animate-spin ml-2" />}إضافة الرقم
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="all" className="animate-fade-in">
        <TabsList className="mb-4">
          <TabsTrigger value="all">الكل ({numbers.length})</TabsTrigger>
          <TabsTrigger value="connected">متصلة ({byType("connected").length})</TabsTrigger>
          <TabsTrigger value="digital">رقمية ({byType("digital").length})</TabsTrigger>
          <TabsTrigger value="sandbox">اختبار ({byType("sandbox").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">{renderTable(numbers)}</TabsContent>
        <TabsContent value="connected">{renderTable(byType("connected"))}</TabsContent>
        <TabsContent value="digital">{renderTable(byType("digital"))}</TabsContent>
        <TabsContent value="sandbox">{renderTable(byType("sandbox"))}</TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default NumbersPage;
