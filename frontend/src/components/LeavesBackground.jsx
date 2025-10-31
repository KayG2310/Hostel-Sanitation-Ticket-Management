// src/components/LeavesBackground.jsx
import React from "react";

/**
 * A purely presentational component that renders several SVG "leaves"
 * positioned absolutely and animated with different durations/delays.
 *
 * No JS animation — everything via CSS keyframes in index.css.
 */

export default function LeavesBackground() {
  // We'll render a few leaves with different classes to vary speed/size/position
  const leaves = [
    { cls: "leaf-a", style: { left: "5%", top: "10%" } },
    { cls: "leaf-b", style: { left: "85%", top: "20%" } },
    { cls: "leaf-c", style: { left: "40%", top: "5%" } },
    { cls: "leaf-d", style: { left: "15%", top: "60%" } },
    { cls: "leaf-e", style: { left: "75%", top: "75%" } },
    { cls: "leaf-f", style: { left: "55%", top: "40%" } },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-white/80 opacity-95"></div>

      {leaves.map((l, i) => (
        <svg
          key={i}
          className={`absolute ${l.cls} transform-gpu`}
          style={{
            width: `${70 + i * 18}px`,
            height: "auto",
            ...l.style,
          }}
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <g transform="translate(0,0)">
            <path
              d="M2 32c8-10 20-12 30-10 6 1 18 5 28 14-10 8-22 12-32 10-9-2-18-10-26-14z"
              fill="url(#leafGrad)"
              opacity="0.95"
            />
            <defs>
              <linearGradient id="leafGrad" x1="0" x2="1">
                <stop offset="0%" stopColor="#63c28b" />
                <stop offset="100%" stopColor="#2b8f56" />
              </linearGradient>
            </defs>
          </g>
        </svg>
      ))}
    </div>
  );
}
