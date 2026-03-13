import { FileText, Download, Loader2, ImageIcon } from "lucide-react";
import { useMediaUrl } from "@/hooks/use-media-url";

interface MediaInfo {
  url?: string;
  mime?: string;
  mime_type?: string;
  filename?: string;
  type?: string;
  storage_key?: string;
  storage_bucket?: string;
  media_file_id?: string;
  id?: string;
}

interface ChatMediaBubbleProps {
  media: MediaInfo;
  isOutbound: boolean;
}

export const ChatMediaBubble = ({ media, isOutbound }: ChatMediaBubbleProps) => {
  const { url, loading } = useMediaUrl(media);
  const mime = media.mime || media.mime_type || "";
  const type = media.type || (mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : mime.startsWith("audio/") ? "audio" : "document");

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">جاري تحميل الملف...</span>
      </div>
    );
  }

  if (!url) {
    // Media not yet processed or unavailable
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
        isOutbound ? "bg-muted/50" : "bg-primary-foreground/10"
      }`}>
        <ImageIcon className="w-5 h-5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {media.id ? "جاري معالجة الملف..." : "ملف غير متاح"}
        </span>
      </div>
    );
  }

  if (type === "image") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img
          src={url}
          alt={media.filename || "صورة"}
          className="rounded-lg max-w-[280px] max-h-[200px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
          loading="lazy"
        />
      </a>
    );
  }

  if (type === "video") {
    return (
      <video
        src={url}
        controls
        className="rounded-lg max-w-[280px] max-h-[200px]"
        preload="metadata"
      />
    );
  }

  if (type === "audio") {
    return <audio src={url} controls className="max-w-[250px]" preload="metadata" />;
  }

  // Document
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        isOutbound
          ? "bg-muted/50 hover:bg-muted"
          : "bg-primary-foreground/10 hover:bg-primary-foreground/20"
      }`}
    >
      <FileText className="w-5 h-5 shrink-0" />
      <span className="text-sm truncate max-w-[180px]">{media.filename || "ملف"}</span>
      <Download className="w-4 h-4 shrink-0 opacity-60" />
    </a>
  );
};
