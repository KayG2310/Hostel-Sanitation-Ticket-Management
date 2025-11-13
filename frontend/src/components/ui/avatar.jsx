// src/components/ui/avatar.jsx
import React from "react";
import { cn } from "../../lib/utils";

export function Avatar({ children, size = "md", className, ...props }) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };
  return (
    <div className={cn("inline-flex items-center justify-center rounded-full bg-muted", sizes[size], className)} {...props}>
      {children}
    </div>
  );
}

export function AvatarFallback({ children, className, ...props }) {
  return <div className={cn("text-sm font-medium", className)} {...props}>{children}</div>;
}