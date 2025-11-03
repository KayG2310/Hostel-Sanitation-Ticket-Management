// src/lib/utils.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind + conditional classNames
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

