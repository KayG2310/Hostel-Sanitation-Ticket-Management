// src/components/ui/badge.jsx
import React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, children, ...props }) {
  return (
    <span className={cn("inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium", className)} {...props}>
      {children}
    </span>
  );
}
