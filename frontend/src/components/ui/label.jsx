// frontend/src/components/ui/label.jsx
import React from "react";
import { cn } from "@/lib/utils";

export function Label({ children, className, ...props }) {
  return <label className={cn("text-sm font-medium text-muted-foreground", className)} {...props}>{children}</label>;
}
