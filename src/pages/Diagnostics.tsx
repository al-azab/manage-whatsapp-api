import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import {
  CheckCircle2, XCircle, Loader2, RefreshCw, Phone, Wifi,
  Database, Key, Send, MessageSquare, AlertTriangle, Activity,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/use-tenant";
import { useToast } from "@/hooks/use-toast";

/* ── types ── */
type CheckStatus = "idle" | "running" | "ok" | "error" | "warn";

interface CheckResult {
  status: CheckStatus;
  label: string;
  detail?: string;
  data?: any;
}

interface NumberTestResult {
  numberId: string;
  phone: string;
  phoneNumberId: string;
  status: CheckStatus;
  detail?: string;
  apiResponse?: any;
  expanded?: boolean;
}

/* ── helpers ── */
function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === "running") return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
  if (status === "ok") return <CheckCircle2 className="w-4 h-4 text-[hsl(var(--chart-2))]" />;
  if (status === "error") return <XCircle className="w-4 h-4 text-destructive" />;
  if (status === "warn") return <AlertTriangle className="w-4 h-4 text-[hsl(var(--chart-4))]" />;
  return <div className="w-4 h-4 rounded-full border border-border" />;
}

function StatusBadge({ status }: { status: CheckStatus }) {
  const map: Record<CheckStatus, { label: string; cls: string }> = {
    idle: { label: "لم يبدأ", cls: "bg-muted text-muted-foreground" },
    running: { label: "جارٍ...", cls: "bg-primary/10 text-primary" },
    ok: { label: "يعمل", cls: "bg-[hsl(var(--chart-2)/0.12)] text-[hsl(var(--chart-2))]" },
    error: { label: "خطأ", cls: "bg-destructive/10 text-destructive" },
    warn: { label: "تحذير", cls: "bg-[hsl(var(--chart-4)/0.12)] text-[hsl(var(--chart-4))]" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-transparent ${cls}`}>
      <StatusIcon status={status} />
      {label}
    </span>
  );
}

/* ── component ── */
const DiagnosticsPage = () => {
  const { tenantId } = useTenant();
  const { toast } = useToast();

  const [running, setRunning] = useState(false);

  const [dbCheck, setDbCheck] = useState<CheckResult>({ status: "idle", label: "قاعدة البيانات" });
  const [authCheck, setAuthCheck] = useState<CheckResult>({ status: "idle", label: "المصادقة" });
  const [waAccountCheck, setWaAccountCheck] = useState<CheckResult>({ status: "idle", label: "حساب واتساب" });
  const [templateCheck, setTemplateCheck] = useState<CheckResult>({ status: "idle", label: "القوالب" });
  const [numberTests, setNumberTests] = useState<NumberTestResult[]>([]);
  const [sendTest, setSendTest] = useState<CheckResult>({ status: "idle", label: "اختبار الإرسال" });
  const [mediaCheck, setMediaCheck] = useState<CheckResult>({ status: "idle", label: "الوسائط والتخزين" });

  const updateNumber = (idx: number, updates: Partial<NumberTestResult>) => {
    setNumberTests(prev => prev.map((n, i) => i === idx ? { ...n, ...updates } : n));
  };

  const runAll = async () => {
    if (!tenantId) return;
    setRunning(true);
    setNumberTests([]);

    /* 1. Auth */
    setAuthCheck({ status: "running", label: "المصادقة" });
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setAuthCheck({ status: "ok", label: "المصادقة", detail: `مسجّل كـ ${user.email}` });
    } else {
      setAuthCheck({ status: "error", label: "المصادقة", detail: "لا يوجد جلسة مستخدم" });
    }

    /* 2. DB */
    setDbCheck({ status: "running", label: "قاعدة البيانات" });
    const { data: tenant, error: tenantErr } = await supabase
      .from("tenants").select("id,name").eq("id", tenantId).single();
    if (tenantErr) {
      setDbCheck({ status: "error", label: "قاعدة البيانات", detail: tenantErr.message });
    } else {
      setDbCheck({ status: "ok", label: "قاعدة البيانات", detail: `المستأجر: ${tenant.name}` });
    }

    /* 3. WA Account */
    setWaAccountCheck({ status: "running", label: "حساب واتساب" });
    const { data: accounts, error: accErr } = await supabase
      .from("wa_accounts").select("id,label,waba_id").eq("tenant_id", tenantId);
    if (accErr || !accounts?.length) {
      setWaAccountCheck({ status: "error", label: "حساب واتساب", detail: accErr?.message || "لا يوجد حساب WABA مربوط" });
    } else {
      setWaAccountCheck({
        status: "ok",
        label: "حساب واتساب",
        detail: `${accounts.length} حساب — ${accounts.map(a => a.label).join("، ")}`,
        data: accounts,
      });
    }

    /* 4. Numbers — test each via WhatsApp API */
    const { data: numbers } = await supabase
      .from("wa_numbers").select("id,phone_e164,phone_number_id,status,type").eq("tenant_id", tenantId);

    if (numbers && numbers.length > 0) {
      const initialTests: NumberTestResult[] = numbers.map(n => ({
        numberId: n.id,
        phone: n.phone_e164,
        phoneNumberId: n.phone_number_id,
        status: "running",
      }));
      setNumberTests(initialTests);

      for (let i = 0; i < numbers.length; i++) {
        const n = numbers[i];
        try {
          const { data: result, error: fnErr } = await supabase.functions.invoke("diagnose_number", {
            body: { tenant_id: tenantId, phone_number_id: n.phone_number_id },
          });

          if (fnErr) {
            updateNumber(i, {
              status: "error",
              detail: fnErr.message || "فشل الاتصال بالوظيفة",
              apiResponse: result,
            });
          } else if (result?.success === false) {
            updateNumber(i, {
              status: "warn",
              detail: result?.error || "خطأ من Meta API",
              apiResponse: result,
            });
          } else if (result?.success === true) {
            const apiData = result?.data;
            updateNumber(i, {
              status: "ok",
              detail: `✓ ${apiData?.verified_name || ""} — ${apiData?.display_phone_number || n.phone_e164}`,
              apiResponse: result,
            });
          } else {
            updateNumber(i, {
              status: "warn",
              detail: "استجابة غير متوقعة",
              apiResponse: result,
            });
          }
        } catch (e: any) {
          updateNumber(i, { status: "error", detail: e.message });
        }
      }
    }

    /* 5. Templates */
    setTemplateCheck({ status: "running", label: "القوالب" });
    const { data: tmplData, error: tmplErr } = await supabase
      .from("templates").select("id,status").eq("tenant_id", tenantId).limit(5);
    if (tmplErr) {
      setTemplateCheck({ status: "error", label: "القوالب", detail: tmplErr.message });
    } else {
      const approved = tmplData?.filter(t => t.status === "APPROVED").length || 0;
      setTemplateCheck({
        status: approved > 0 ? "ok" : "warn",
        label: "القوالب",
        detail: `${tmplData?.length || 0} قالب، منها ${approved} موافق عليه`,
      });
    }

    /* 6. Media / Storage */
    setMediaCheck({ status: "running", label: "الوسائط والتخزين" });
    const { data: mediaData, error: mediaErr } = await supabase
      .from("media_files").select("id,kind").eq("tenant_id", tenantId).limit(10);
    if (mediaErr) {
      setMediaCheck({ status: "error", label: "الوسائط والتخزين", detail: mediaErr.message });
    } else {
      setMediaCheck({
        status: "ok",
        label: "الوسائط والتخزين",
        detail: `${mediaData?.length || 0}+ ملف وسائط مخزّن`,
      });
    }

    setRunning(false);
  };

  /* ── Send test ── */
  const runSendTest = async () => {
    if (!tenantId) return;
    setSendTest({ status: "running", label: "اختبار الإرسال" });

    // Get first open conversation
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("status", "open")
      .limit(1)
      .maybeSingle();

    if (!conv) {
      setSendTest({ status: "warn", label: "اختبار الإرسال", detail: "لا توجد محادثة مفتوحة للاختبار — أنشئ محادثة أولاً" });
      return;
    }

    const { data: result, error } = await supabase.functions.invoke("send_message", {
      body: {
        tenant_id: tenantId,
        conversation_id: conv.id,
        text: `رسالة اختبار — ${new Date().toLocaleString("ar")}`,
      },
    });

    if (error || result?.error) {
      setSendTest({ status: "error", label: "اختبار الإرسال", detail: error?.message || result?.error });
    } else {
      setSendTest({ status: "ok", label: "اختبار الإرسال", detail: `✓ تم الإرسال — message_id: ${result?.message_id?.slice(0, 8)}` });
    }
  };

  const allChecks = [dbCheck, authCheck, waAccountCheck, templateCheck, mediaCheck];
  const overallOk = allChecks.every(c => c.status === "ok");
  const hasError = allChecks.some(c => c.status === "error");
  const overallStatus: CheckStatus = running ? "running" : hasError ? "error" : overallOk ? "ok" : "idle";

  return (
    <DashboardLayout>
      <PageHeader
        title="تشخيص النظام"
        description="اختبار الاتصالات والأرقام وعمليات التطبيق"
      >
        <Button onClick={runAll} disabled={running} className="gap-2">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          تشغيل الاختبارات
        </Button>
      </PageHeader>

      {/* Overall status banner */}
      {overallStatus !== "idle" && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${
          overallStatus === "ok" ? "bg-[hsl(var(--chart-2)/0.08)] border-[hsl(var(--chart-2)/0.2)]" :
          overallStatus === "error" ? "bg-destructive/5 border-destructive/20" :
          "bg-primary/5 border-primary/20"
        }`}>
          <StatusIcon status={overallStatus} />
          <div>
            <p className="font-semibold text-sm">
              {overallStatus === "running" ? "جارٍ تشغيل الاختبارات..." :
               overallStatus === "ok" ? "جميع الاختبارات نجحت ✓" :
               "بعض الاختبارات فشلت — راجع التفاصيل أدناه"}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Core Services */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center gap-2">
            <Database className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">الخدمات الأساسية</h3>
          </div>
          <div className="divide-y divide-border">
            {[dbCheck, authCheck, waAccountCheck, templateCheck, mediaCheck].map((check, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{check.label}</p>
                  {check.detail && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{check.detail}</p>
                  )}
                </div>
                <StatusBadge status={check.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Number Tests */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">اختبار الأرقام</h3>
            <span className="text-xs text-muted-foreground mr-auto">{numberTests.length} رقم</span>
          </div>
          <div className="divide-y divide-border">
            {numberTests.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                {running ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> جارٍ اختبار الأرقام...
                  </div>
                ) : "اضغط «تشغيل الاختبارات» لبدء الفحص"}
              </div>
            ) : (
              numberTests.map((nt, i) => (
                <div key={nt.numberId} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium font-mono" dir="ltr">{nt.phone}</p>
                      {nt.detail && (
                        <p className="text-xs text-muted-foreground mt-0.5">{nt.detail}</p>
                      )}
                      <p className="text-xs text-muted-foreground/60 font-mono mt-0.5" dir="ltr">
                        ID: {nt.phoneNumberId}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={nt.status} />
                      {nt.apiResponse && (
                        <button
                          onClick={() => updateNumber(i, { expanded: !nt.expanded })}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {nt.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                  {nt.expanded && nt.apiResponse && (
                    <pre className="mt-3 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-48 text-left dir-ltr">
                      {JSON.stringify(nt.apiResponse, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Send Test */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center gap-2">
            <Send className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">اختبار إرسال رسالة</h3>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-muted-foreground mb-4">
              يرسل رسالة نصية تجريبية إلى أول محادثة مفتوحة في النظام عبر WhatsApp Cloud API مباشرةً.
            </p>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                {sendTest.detail && (
                  <p className={`text-sm ${sendTest.status === "error" ? "text-destructive" : sendTest.status === "ok" ? "text-[hsl(var(--chart-2))]" : "text-muted-foreground"}`}>
                    {sendTest.detail}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {sendTest.status !== "idle" && <StatusBadge status={sendTest.status} />}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={runSendTest}
                  disabled={sendTest.status === "running"}
                  className="gap-2"
                >
                  {sendTest.status === "running" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  إرسال اختبار
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* API Connectivity */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">معلومات البيئة</h3>
          </div>
          <div className="px-5 py-4 space-y-3">
            <InfoRow label="Supabase Project" value="uwkdtbodoglbptiediea" mono />
            <InfoRow label="WA API Version" value={`v24.0 (من السيكرتس)`} />
            <InfoRow label="عدد الأرقام المسجّلة" value={`${numberTests.length} رقم`} />
            <InfoRow label="حالة النظام العامة" value={
              overallStatus === "ok" ? "✓ يعمل بشكل صحيح" :
              overallStatus === "error" ? "✗ يوجد أخطاء" :
              overallStatus === "running" ? "جارٍ الفحص..." : "لم يبدأ الفحص"
            } />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono text-xs" : ""}`} dir={mono ? "ltr" : "rtl"}>{value}</span>
    </div>
  );
}

export default DiagnosticsPage;
