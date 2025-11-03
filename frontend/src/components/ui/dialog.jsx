// frontend/src/components/ui/dialog.jsx
import React from "react";
import { cn } from "@/lib/utils";

export function Dialog({ open, onOpenChange, children }) {
  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* darker overlay so white dialog pops */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-10 w-full max-w-2xl mx-4">{children}</div>
    </div>
  ) : null;
}

export function DialogContent({ className, children, ...props }) {
  return (
    <div
      className={cn(
        // solid white, rounded, and clear shadow
        "bg-white border border-gray-200 rounded-lg shadow-lg p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ className, children, ...props }) {
  return <div className={cn("mb-4", className)} {...props}>{children}</div>;
}

export function DialogTitle({ className, children, ...props }) {
  return <h3 className={cn("text-xl font-semibold", className)} {...props}>{children}</h3>;
}
