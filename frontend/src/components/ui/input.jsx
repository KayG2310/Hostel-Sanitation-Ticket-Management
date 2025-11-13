// src/components/ui/input.jsx
import React from "react";
import { cn } from "../../lib/utils";

export function Input(props) {
  return (
    <input
      {...props}
      className={cn("flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring", props.className)}
    />
  );
}