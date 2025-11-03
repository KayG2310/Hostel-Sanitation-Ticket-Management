// frontend/src/components/ui/card.jsx
import React from "react";
import { cn } from "@/lib/utils";

/**
 * Card primitives — use solid white as default so cards are opaque.
 * You can pass className to override for specific cases.
 */
export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        // solid white background + soft shadow
        "rounded-xl border bg-white text-card-foreground shadow",
        // subtle border color
        "border-gray-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <div className={cn("text-2xl font-semibold leading-none tracking-tight text-slate-800", className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("p-6 pt-0 text-slate-700", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn("flex items-center p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
}
