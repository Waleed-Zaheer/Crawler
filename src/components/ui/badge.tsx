import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// Lifted from my-snippets' Badge (compiled bundle). `success` is our own
// addition, following the same structural pattern as their variants.
type Variant = "default" | "secondary" | "outline" | "ghost" | "destructive" | "success";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const base =
  "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all [&>svg]:pointer-events-none [&>svg]:size-3!";

const variantClasses: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  destructive: "bg-destructive/10 text-destructive dark:bg-destructive/20",
  outline: "border-border text-foreground",
  ghost: "text-muted-foreground",
  success: "bg-success/10 text-success dark:bg-success/20",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <span className={cn(base, variantClasses[variant], className)} {...props} />;
}
