"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef } from "react";

interface GradientCircle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

export default function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const circles: GradientCircle[] = [
    {
      id: 1,
      x: 22,
      y: 24,
      size: 110,
      color: "from-white/60 via-white/10 to-transparent",
    },
    {
      id: 2,
      x: 78,
      y: 74,
      size: 90,
      color: "from-[#e6ddcf]/50 via-transparent to-transparent",
    },
    {
      id: 3,
      x: 58,
      y: 32,
      size: 70,
      color: "from-[#ccb899]/40 via-transparent to-transparent",
    },
  ];

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#f9f9f7] via-[#f3f1ec] to-[#ece8e0]" />
      {circles.map((circle, index) => {
        if (shouldReduceMotion) {
          return (
            <div
              key={circle.id}
              className={`absolute rounded-full blur-[70px] bg-gradient-to-br ${circle.color}`}
              style={{
                left: `${circle.x}%`,
                top: `${circle.y}%`,
                width: `${circle.size * 3.5}px`,
                height: `${circle.size * 3.5}px`,
                transform: "translate(-50%, -50%)",
                opacity: 0.28,
              }}
            />
          );
        }

        return (
          <motion.div
            key={circle.id}
            className={`absolute rounded-full blur-[70px] bg-gradient-to-br ${circle.color}`}
            style={{
              left: 0,
              top: 0,
              transform: "translate(-50%, -50%)",
            }}
            initial={{
              x: `${circle.x}%`,
              y: `${circle.y}%`,
              width: `${circle.size * 3.5}px`,
              height: `${circle.size * 3.5}px`,
              opacity: 0.28,
            }}
            animate={{
              x: [`${circle.x}%`, `${circle.x + 8}%`, `${circle.x - 5}%`, `${circle.x}%`],
              y: [`${circle.y}%`, `${circle.y - 6}%`, `${circle.y + 8}%`, `${circle.y}%`],
              opacity: [0.24, 0.3, 0.27, 0.24],
            }}
            transition={{ duration: 18 + index * 3, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}
    </div>
  );
}
