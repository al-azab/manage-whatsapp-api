import { FileText, Download } from "lucide-react";

interface ChatMediaBubbleProps {
  media: {
    url: string;
    mime: string;
    filename?: string;
    type?: string;
  };
  isOutbound: boolean;
}

export const ChatMediaBubble = ({ media, isOutbound }: ChatMediaBubbleProps) => {
  const type = media.type || (media.mime?.startsWith("image/") ? "image" : media.mime?.startsWith("video/") ? "video" : media.mime?.startsWith("audio/") ? "audio" : "document");

  if (type === "image") {
    return (
      <a href={media.url} target="_blank" rel="noopener noreferrer">
        <img
          src={media.url}
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
        src={media.url}
        controls
        className="rounded-lg max-w-[280px] max-h-[200px]"
        preload="metadata"
      />
    );
  }

  if (type === "audio") {
    return <audio src={media.url} controls className="max-w-[250px]" preload="metadata" />;
  }

  // Document
  return (
    <a
      href={media.url}
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
