// src/components/BubblesBackground.jsx
import React, { useMemo } from "react";

/**
 * Stable BubblesBackground
 * - Generates bubble parameters only once (useMemo with empty deps)
 * - Avoids re-generating on parent re-renders (typing, state changes, etc.)
 */
export default function BubblesBackground({ count = 20 }) {
  const bubbles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const size = 24 + Math.floor(Math.random() * 72); // 24px -> 96px
      const left = Math.floor(Math.random() * 100); // 0% -> 99%
      const dur = (12 + Math.random() * 18).toFixed(1) + "s"; // 12s -> 30s
      const delay = (Math.random() * 8).toFixed(2) + "s";
      const dx = (Math.random() * 120 - 60).toFixed(1) + "px"; // horizontal drift
      return { key: i, size, left, dur, delay, dx };
    });
  }, [count]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ contain: "none" }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg,#f8fcff 0%, #eef9ff 60%)" }}
      />
      {bubbles.map((b) => (
        <div
          key={b.key}
          className="bubble"
          style={{
            width: `${b.size}px`,
            height: `${b.size}px`,
            left: `${b.left}%`,
            bottom: `-${b.size + 20}px`,
            animationDuration: b.dur,
            animationDelay: b.delay,
            transform: "translateX(-50%)",
            // expose dx via CSS custom prop
            // set property using style object
            ["--dx"]: b.dx,
          }}
        />
      ))}
    </div>
  );
}
