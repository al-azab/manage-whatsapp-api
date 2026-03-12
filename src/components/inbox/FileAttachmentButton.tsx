import { useState, useRef } from "react";
import { Paperclip, X, FileText, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FileAttachmentButtonProps {
  tenantId: string;
  onFileReady: (file: { url: string; mime: string; filename: string }) => void;
  onClear: () => void;
  pendingFile: { url: string; mime: string; filename: string } | null;
}

const MAX_SIZE = 16 * 1024 * 1024; // 16MB WhatsApp limit

export const FileAttachmentButton = ({ tenantId, onFileReady, onClear, pendingFile }: FileAttachmentButtonProps) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handlePick = () => fileRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE) {
      toast({ title: "الملف كبير جداً", description: "الحد الأقصى 16 ميجا", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${tenantId}/outbound/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: upErr } = await supabase.storage.from("wa-media").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

      if (upErr) throw upErr;

      // Get a signed URL valid for 1 hour (for WA API to download)
      const { data: signed, error: signErr } = await supabase.storage
        .from("wa-media")
        .createSignedUrl(path, 3600);

      if (signErr || !signed) throw signErr || new Error("Failed to create signed URL");

      onFileReady({
        url: signed.signedUrl,
        mime: file.type,
        filename: file.name,
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({ title: "خطأ في الرفع", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (pendingFile) {
    const isImage = pendingFile.mime.startsWith("image/");
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm">
        {isImage ? (
          <img src={pendingFile.url} alt="" className="w-8 h-8 rounded object-cover" />
        ) : (
          <FileText className="w-5 h-5 text-muted-foreground" />
        )}
        <span className="truncate max-w-[150px]">{pendingFile.filename}</span>
        <button onClick={onClear} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
        onChange={handleFile}
      />
      <button
        onClick={handlePick}
        disabled={uploading}
        className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted disabled:opacity-50"
        title="إرفاق ملف"
      >
        {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
      </button>
    </>
  );
};
