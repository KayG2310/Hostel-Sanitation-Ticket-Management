// frontend/src/components/ui/button.jsx
import React from "react";
import { cn } from "../../lib/utils";

/**
 * Exposes named export Button and default export.
 * Primary color uses green; secondary/outline available.
 */
export function Button({ children, className, variant = "primary", size = "default", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-green-600 text-white hover:bg-green-700 border border-green-700",
    blue: "bg-[#4b9cd3] text-white hover:bg-[#3a8bb7] border border-[#3a8bb7]",
    outline: "bg-white text-slate-700 border border-gray-200 hover:shadow-sm",
    subtle: "bg-transparent text-slate-700 border border-transparent hover:bg-gray-50",
  };
  const sizes = {
    default: "min-h-9 px-4 py-2",
    sm: "min-h-8 px-3 text-xs",
    lg: "min-h-10 px-6",
    icon: "h-9 w-9",
  };

  return (
    <button
      className={cn(base, variants[variant] || variants.primary, sizes[size] || sizes.default, className)}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
