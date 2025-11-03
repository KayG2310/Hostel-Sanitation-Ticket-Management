// src/components/AIConfidenceBadge.jsx
import React from "react";

export default function AIConfidenceBadge({ confidence = 0, isClean = false }) {
  const pct = Math.round(confidence);
  const base = "inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium";
  const cls = isClean ? "bg-green-100 text-green-800 border border-green-200" : "bg-[#e6f7ff] text-[#045a8d] border border-[#cfeefb]";
  return (
    <div className={`${base} ${cls}`}>
      <span className="font-semibold">AI</span>
      <span>{pct}%</span>
    </div>
  );
}

