// src/components/SwirlTransition.jsx
import React from "react";

/**
 * SwirlTransition
 * Props:
 *  - active: boolean (when true the swirl animation runs)
 *
 * The component is pointer-events-none so it won't block clicks.
 */
export default function SwirlTransition({ active = false }) {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0"}`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className={`swirl-layer ${active ? "swirl-active" : ""}`} />
      </div>
    </div>
  );
}

