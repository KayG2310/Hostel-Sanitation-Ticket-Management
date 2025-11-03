// src/components/ui/textarea.jsx
import React from "react";
import { cn } from "@/lib/utils";

export function Textarea(props) {
  return (
    <textarea
      {...props}
      className={cn("flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring", props.className)}
    />
  );
}
