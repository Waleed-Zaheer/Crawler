import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("flex items-center gap-2 text-sm leading-none font-medium select-none", className)}
      {...props}
    />
  ),
);
Label.displayName = "Label";
