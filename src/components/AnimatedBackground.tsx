"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

interface GradientCircle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

export default function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimatingRef = useRef(false);

  const circles: GradientCircle[] = [
    {
      id: 1,
      x: 20,
      y: 20,
      size: 96,
      color: "from-amber-200/30 to-orange-200/20",
    },
    {
      id: 2,
      x: 80,
      y: 80,
      size: 80,
      color: "from-yellow-200/25 to-amber-300/15",
    },
    {
      id: 3,
      x: 50,
      y: 30,
      size: 64,
      color: "from-orange-100/20 to-amber-100/30",
    },
  ];

  useEffect(() => {
    const handleButtonClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
        // Simple animation trigger - let Framer Motion handle the animation
        isAnimatingRef.current = true;
        setTimeout(() => {
          isAnimatingRef.current = false;
        }, 2500);
      }
    };

    document.addEventListener('click', handleButtonClick);
    return () => document.removeEventListener('click', handleButtonClick);
  }, []);

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
        duration: 8,
        repeat: Infinity,
        delay: index * 1.5,
      }
    };
  };

  const getClickAnimationProps = (index: number) => {
    const time = Date.now() / 1000;
    const seed = time + index;
    const newX = 20 + (Math.sin(seed) * 60 + 60) / 2;
    const newY = 20 + (Math.cos(seed * 1.3) * 60 + 60) / 2;

    return {
      animate: isAnimatingRef.current ? {
        x: `${newX}%`,
        y: `${newY}%`,
        scale: [1, 1.4, 1.1, 1],
        rotate: [0, 10, -5, 0],
      } : {},
      transition: {
        duration: 2.5,
      }
    };
  };

  return (
    <div ref={containerRef}>
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50"></div>
      {circles.map((circle, index) => (
        <motion.div
          key={circle.id}
          className={`absolute rounded-full blur-[60px] bg-gradient-to-br ${circle.color}`}
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
