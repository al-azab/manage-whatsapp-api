import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Search, Send, Loader2, Plus, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/use-tenant";
import { useToast } from "@/hooks/use-toast";
import { FileAttachmentButton } from "@/components/inbox/FileAttachmentButton";
import { ChatMediaBubble } from "@/components/inbox/ChatMediaBubble";
import { MessageStatus } from "@/components/inbox/MessageStatus";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const InboxPage = () => {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingFile, setPendingFile] = useState<{
    url: string;
    mime: string;
    filename: string;
    storageKey: string;
    storageBucket: string;
  } | null>(null);
  const { toast } = useToast();

  // New conversation dialog
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [waNumbers, setWaNumbers] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState("");
  const [selectedWaNumber, setSelectedWaNumber] = useState("");
  const [creatingConv, setCreatingConv] = useState(false);

  const fetchConversations = async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from("conversations")
      .select("id, status, last_message_at, assigned_to, contacts(id, phone_e164, display_name), wa_numbers(phone_e164)")
      .eq("tenant_id", tenantId)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(50);
    setConversations(data || []);
    setLoading(false);
  };

  const fetchContactsAndNumbers = async () => {
    if (!tenantId) return;
    const [{ data: c }, { data: n }] = await Promise.all([
      supabase.from("contacts").select("id, phone_e164, display_name").eq("tenant_id", tenantId).limit(100),
      supabase.from("wa_numbers").select("id, phone_e164, phone_number_id").eq("tenant_id", tenantId).limit(20),
    ]);
    setContacts(c || []);
    setWaNumbers(n || []);
    if (n && n.length > 0) setSelectedWaNumber(n[0].id);
  };

  useEffect(() => { fetchConversations(); }, [tenantId]);

  useEffect(() => {
    if (newConvOpen) fetchContactsAndNumbers();
  }, [newConvOpen, tenantId]);

  useEffect(() => {
    if (!selectedConv) { setMessages([]); return; }
    setMsgLoading(true);
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", selectedConv)
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data }) => {
        setMessages(data || []);
        setMsgLoading(false);
      });
  }, [selectedConv]);

  // Realtime subscription (INSERT + UPDATE for delivery status)
  useEffect(() => {
    if (!tenantId) return;
    const channel = supabase
      .channel("inbox-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `tenant_id=eq.${tenantId}` }, (payload) => {
        if (payload.new.conversation_id === selectedConv) {
          setMessages((prev) => [...prev, payload.new]);
        }
        fetchConversations();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `tenant_id=eq.${tenantId}` }, (payload) => {
        if (payload.new.conversation_id === selectedConv) {
          setMessages((prev) => prev.map((m) => m.id === payload.new.id ? payload.new : m));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tenantId, selectedConv]);

  const handleCreateConversation = async () => {
    if (!selectedContact || !selectedWaNumber || !tenantId) return;
    setCreatingConv(true);

    // Check if open conversation already exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("wa_number_id", selectedWaNumber)
      .eq("contact_id", selectedContact)
      .eq("status", "open")
      .maybeSingle();

    if (existing) {
      setSelectedConv(existing.id);
      setNewConvOpen(false);
      setCreatingConv(false);
      return;
    }

    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({
        tenant_id: tenantId,
        wa_number_id: selectedWaNumber,
        contact_id: selectedContact,
        status: "open",
      })
      .select("id")
      .single();

    setCreatingConv(false);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
      return;
    }
    await fetchConversations();
    setSelectedConv(newConv.id);
    setNewConvOpen(false);
    setSelectedContact("");
  };

  const handleSend = async () => {
    if (!selectedConv || (!newMsg.trim() && !pendingFile) || !tenantId) return;
    setSending(true);

    const payload: Record<string, unknown> = {
      tenant_id: tenantId,
      conversation_id: selectedConv,
    };

    if (pendingFile) {
      payload.media_url = pendingFile.url;
      payload.media_mime = pendingFile.mime;
      payload.media_filename = pendingFile.filename;
      if (newMsg.trim()) payload.caption = newMsg;
    } else {
      payload.text = newMsg;
    }

    const { error } = await supabase.functions.invoke("send_message", { body: payload });
    setSending(false);
    if (error) {
      toast({ title: "خطأ في الإرسال", description: error.message, variant: "destructive" });
    } else {
      setNewMsg("");
      setPendingFile(null);
    }
  };

  const selectedConvData = conversations.find((c) => c.id === selectedConv);
  const contact = selectedConvData?.contacts;

  const filteredConversations = search
    ? conversations.filter((c) => {
        const ct = c.contacts;
        return ct?.phone_e164?.includes(search) || ct?.display_name?.includes(search);
      })
    : conversations;

  if (tenantLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-3rem)] -m-6 animate-fade-in">
        {/* Conversations List */}
        <div className="w-80 border-l border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">صندوق الوارد ({conversations.length})</h2>
              <Button size="sm" onClick={() => setNewConvOpen(true)} className="h-8 gap-1">
                <Plus className="w-3.5 h-3.5" />
                جديد
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="بحث..." className="pr-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-3">لا توجد محادثات</p>
                <Button size="sm" variant="outline" onClick={() => setNewConvOpen(true)}>
                  <Plus className="w-3.5 h-3.5 ml-1" />
                  ابدأ محادثة
                </Button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const ct = conv.contacts;
                const isSelected = conv.id === selectedConv;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConv(conv.id)}
                    className={`p-4 border-b border-border cursor-pointer transition-colors hover:bg-muted/50 ${isSelected ? "bg-primary/5 border-r-2 border-r-primary" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                        {(ct?.display_name || ct?.phone_e164 || "?").charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{ct?.display_name || ct?.phone_e164}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5" dir="ltr">{ct?.phone_e164}</p>
                      </div>
                      <StatusBadge status={conv.status === "open" ? "success" : conv.status === "pending" ? "warning" : "neutral"} label={conv.status === "open" ? "مفتوح" : conv.status === "pending" ? "معلق" : "مغلق"} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-background">
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={MessageSquare} title="اختر محادثة" description="اختر محادثة من القائمة أو ابدأ محادثة جديدة" />
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-border flex items-center gap-3 bg-card">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                  {(contact?.display_name || contact?.phone_e164 || "?").charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{contact?.display_name || "جهة اتصال"}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">{contact?.phone_e164}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgLoading ? (
                  <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8">لا توجد رسائل بعد</div>
                ) : (
                  messages.map((msg) => {
                    const mediaMeta = (msg.meta as any)?.media;
                    const isOutbound = msg.direction === "outbound";
                    return (
                      <div key={msg.id} className={`flex ${isOutbound ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                          isOutbound
                            ? "bg-card border border-border rounded-br-sm"
                            : "bg-primary text-primary-foreground rounded-bl-sm"
                        }`}>
                          {mediaMeta && (mediaMeta.url || mediaMeta.storage_key || mediaMeta.media_file_id || mediaMeta.id) && (
                            <div className="mb-1.5">
                              <ChatMediaBubble media={mediaMeta} isOutbound={isOutbound} />
                            </div>
                          )}
                          {msg.text && !(mediaMeta && msg.text === `[${mediaMeta.type}]`) && (
                            <p className="text-sm">{msg.text}</p>
                          )}
                          <div className={`flex items-center gap-0.5 mt-1 ${isOutbound ? "justify-start" : "justify-end"}`}>
                            <span className={`text-[10px] ${isOutbound ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
                              {new Date(msg.created_at).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <MessageStatus status={msg.status} isOutbound={isOutbound} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 border-t border-border bg-card">
                {pendingFile && (
                  <div className="mb-2">
                    <FileAttachmentButton
                      tenantId={tenantId!}
                      onFileReady={setPendingFile}
                      onClear={() => setPendingFile(null)}
                      pendingFile={pendingFile}
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {!pendingFile && (
                    <FileAttachmentButton
                      tenantId={tenantId!}
                      onFileReady={setPendingFile}
                      onClear={() => setPendingFile(null)}
                      pendingFile={null}
                    />
                  )}
                  <Input
                    placeholder={pendingFile ? "أضف تعليقاً (اختياري)..." : "اكتب رسالة..."}
                    className="flex-1"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || (!newMsg.trim() && !pendingFile)}
                    className="bg-primary text-primary-foreground p-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={newConvOpen} onOpenChange={setNewConvOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>محادثة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>جهة الاتصال</Label>
              <Select value={selectedContact} onValueChange={setSelectedContact}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر جهة اتصال..." />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.display_name || c.phone_e164} <span className="text-muted-foreground text-xs mr-1" dir="ltr">{c.phone_e164}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>رقم واتساب المرسِل</Label>
              <Select value={selectedWaNumber} onValueChange={setSelectedWaNumber}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر رقم..." />
                </SelectTrigger>
                <SelectContent>
                  {waNumbers.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      <span dir="ltr">{n.phone_e164}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewConvOpen(false)}>إلغاء</Button>
            <Button
              onClick={handleCreateConversation}
              disabled={!selectedContact || !selectedWaNumber || creatingConv}
            >
              {creatingConv ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              فتح محادثة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default InboxPage;
