"use client";

import React, { useEffect, useRef, useState } from "react";

type Ripple = { id: number; x: number; y: number };

export default function TouchRipple({ color = "rgba(255,255,255,0.35)" }: { color?: string }) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (ripples.length === 0) return;
    const t = setTimeout(() => setRipples((r) => r.slice(1)), 550);
    return () => clearTimeout(t);
  }, [ripples]);

  (TouchRipple as unknown as { emit?: (x: number, y: number) => void }).emit = (x: number, y: number) => {
    idRef.current += 1;
    setRipples((prev) => [...prev, { id: idRef.current, x, y }]);
  };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute block animate-button-ripple"
          style={{
            left: r.x - 4,
            top: r.y - 4,
            width: 8,
            height: 8,
            borderRadius: 9999,
            background: color,
          }}
        />
      ))}
    </div>
  );
}
