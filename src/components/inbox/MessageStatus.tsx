import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface MessageStatusProps {
  status: string;
  isOutbound: boolean;
}

const statusConfig: Record<string, { icon: typeof Check; label: string; className: string }> = {
  queued: { icon: Clock, label: "في الانتظار", className: "text-muted-foreground" },
  sent: { icon: Check, label: "تم الإرسال", className: "text-muted-foreground" },
  delivered: { icon: CheckCheck, label: "تم التوصيل", className: "text-muted-foreground" },
  read: { icon: CheckCheck, label: "تمت القراءة", className: "text-blue-500" },
  failed: { icon: AlertCircle, label: "فشل الإرسال", className: "text-destructive" },
};

export function MessageStatus({ status, isOutbound }: MessageStatusProps) {
  if (!isOutbound) return null;

  const config = statusConfig[status] || statusConfig.sent;
  const Icon = config.icon;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Icon className={`inline-block w-3.5 h-3.5 mr-1 ${config.className}`} />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {config.label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
