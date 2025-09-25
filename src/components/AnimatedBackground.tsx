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

interface VeilLayer {
  id: string;
  gradient: string;
  width: number;
  height: number;
  blur: string;
  opacity: number;
  rotate: number;
  translateX: string;
  translateY: string;
  delay: number;
}

export default function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const circles: GradientCircle[] = [
    {
      id: 1,
      x: 20,
      y: 26,
      size: 120,
      color: "from-white/70 via-white/15 to-transparent",
    },
    {
      id: 2,
      x: 78,
      y: 72,
      size: 95,
      color: "from-[#eadfcf]/55 via-transparent to-transparent",
    },
    {
      id: 3,
      x: 54,
      y: 32,
      size: 78,
      color: "from-[#c8b090]/40 via-transparent to-transparent",
    },
  ];

  const veils: VeilLayer[] = [
    {
      id: "veil-1",
      gradient: "from-white/25 via-white/5 to-transparent",
      width: 620,
      height: 420,
      blur: "blur-[120px]",
      opacity: 0.25,
      rotate: -8,
      translateX: "-30%",
      translateY: "-45%",
      delay: 0,
    },
    {
      id: "veil-2",
      gradient: "from-[#cfae7a]/30 via-transparent to-transparent",
      width: 540,
      height: 460,
      blur: "blur-[140px]",
      opacity: 0.32,
      rotate: 12,
      translateX: "45%",
      translateY: "55%",
      delay: 3.2,
    },
  ];

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#f9f9f7] via-[#f3f1ec] to-[#ece8e0]" />
      {circles.map((circle, index) => {
        const baseStyle = {
          width: `${circle.size * 3.6}px`,
          height: `${circle.size * 3.6}px`,
        };

        if (shouldReduceMotion) {
          return (
            <div
              key={circle.id}
              className={`absolute rounded-full blur-[80px] bg-gradient-to-br ${circle.color}`}
              style={{
                left: `${circle.x}%`,
                top: `${circle.y}%`,
                transform: "translate(-50%, -50%) scale(1)",
                opacity: 0.28,
                ...baseStyle,
              }}
            />
          );
        }

        return (
          <motion.div
            key={circle.id}
            className={`absolute rounded-full blur-[80px] bg-gradient-to-br ${circle.color}`}
            style={{ left: 0, top: 0, transform: "translate(-50%, -50%)" }}
            initial={{
              x: `${circle.x}%`,
              y: `${circle.y}%`,
              opacity: 0.26,
              ...baseStyle,
            }}
            animate={{
              x: [`${circle.x}%`, `${circle.x + 7}%`, `${circle.x - 4}%`, `${circle.x}%`],
              y: [`${circle.y}%`, `${circle.y - 5}%`, `${circle.y + 7}%`, `${circle.y}%`],
              opacity: [0.22, 0.3, 0.26, 0.24],
              scale: [1, 1.04, 0.98, 1],
            }}
            transition={{
              duration: 22 + index * 4,
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        );
      })}

      {shouldReduceMotion
        ? null
        : veils.map((veil) => (
            <motion.div
              key={veil.id}
              className={`absolute ${veil.blur} bg-gradient-to-br ${veil.gradient} mix-blend-screen`}
              style={{
                width: veil.width,
                height: veil.height,
                left: "50%",
                top: "50%",
                opacity: veil.opacity,
                transform: `translate(${veil.translateX}, ${veil.translateY}) rotate(${veil.rotate}deg)`,
              }}
              animate={{
                rotate: [veil.rotate, veil.rotate + 4, veil.rotate - 6, veil.rotate],
                opacity: [veil.opacity * 0.7, veil.opacity, veil.opacity * 0.85],
              }}
              transition={{
                duration: 26,
                repeat: Infinity,
                ease: [0.45, 0, 0.2, 1],
                delay: veil.delay,
              }}
            />
          ))}

      {!shouldReduceMotion && (
        <>
          <motion.div
            className="absolute left-1/2 top-[-22%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-b from-white/50 via-white/5 to-transparent blur-[90px] mix-blend-screen"
            animate={{
              scale: [1.1, 1.16, 1.08, 1.1],
              opacity: [0.25, 0.32, 0.26, 0.25],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
          />
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.22),rgba(255,255,255,0))]"
            animate={{
              backgroundPosition: ["0% 0%", "40% 20%", "20% 60%", "0% 0%"],
              opacity: [0.2, 0.32, 0.24, 0.2],
            }}
            transition={{ duration: 28, repeat: Infinity, ease: [0.45, 0, 0.25, 1] }}
            style={{ mixBlendMode: "soft-light" }}
          />
        </>
      )}
    </div>
  );
}
