import { CheckCircle2, CircleSlash, ShieldAlert, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PageResult } from "@/types";

const STATUS_CONFIG: Record<
  PageResult["status"],
  { variant: "success" | "destructive" | "secondary" | "default"; icon: typeof CheckCircle2; label: string }
> = {
  success: { variant: "success", icon: CheckCircle2, label: "success" },
  error: { variant: "destructive", icon: XCircle, label: "error" },
  skipped: { variant: "secondary", icon: CircleSlash, label: "skipped" },
  disallowed: { variant: "default", icon: ShieldAlert, label: "disallowed" },
};

export function StatusBadge({ status }: { status: PageResult["status"] }) {
  const { variant, icon: Icon, label } = STATUS_CONFIG[status];
  return (
    <Badge variant={variant}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
