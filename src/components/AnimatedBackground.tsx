"use client";

import { motion } from "framer-motion";
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

  const getAnimationProps = (index: number) => {
    const circle = circles[index];
    const baseX = circle.x;
    const baseY = circle.y;

    return {
      animate: {
        x: [
          `${baseX}%`,
          `${baseX + 15}%`,
          `${baseX - 10}%`,
          `${baseX + 8}%`,
          `${baseX}%`
        ],
        y: [
          `${baseY}%`,
          `${baseY - 12}%`,
          `${baseY + 18}%`,
          `${baseY - 5}%`,
          `${baseY}%`
        ],
        scale: [1, 1.1, 0.9, 1.05, 1],
      },
      transition: {
        duration: 14,
        repeat: Infinity,
        delay: index * 2.4,
      }
    };
  };

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#f9f9f7] via-[#f3f1ec] to-[#ece8e0]" />
      <motion.div
        className="absolute -right-20 -top-32 h-[420px] w-[320px] rounded-[45%] blur-[140px]"
        style={{
          background:
            "radial-gradient(circle at 30% 35%, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0))",
        }}
        animate={{
          x: ["0%", "-4%", "3%", "0%"],
          y: ["0%", "6%", "-4%", "0%"],
          opacity: [0.24, 0.36, 0.28, 0.24],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -left-24 bottom-[-18%] h-[360px] w-[420px] rounded-[50%] blur-[150px]"
        style={{
          background:
            "radial-gradient(circle at 60% 50%, rgba(183, 146, 90, 0.22), rgba(183, 146, 90, 0))",
          mixBlendMode: "screen",
        }}
        animate={{
          x: ["0%", "5%", "-3%", "1%", "0%"],
          y: ["0%", "-4%", "3%", "-2%", "0%"],
          opacity: [0.16, 0.28, 0.22, 0.18, 0.16],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      {circles.map((circle, index) => (
        <motion.div
          key={circle.id}
          className={`absolute rounded-full blur-[80px] bg-gradient-to-br ${circle.color}`}
          style={{
            left: 0,
            top: 0,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{
            x: `${circle.x}%`,
            y: `${circle.y}%`,
            width: `${circle.size * 4}px`,
            height: `${circle.size * 4}px`,
          }}
          {...getAnimationProps(index)}
        />
      ))}
    </div>
  );
}
