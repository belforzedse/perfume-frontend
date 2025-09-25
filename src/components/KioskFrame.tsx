"use client";

import React, { startTransition, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import AnimatedBackground from "@/components/AnimatedBackground";

const IDLE_TIMEOUT_MS = 30_000;

export default function KioskFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const idleTimerRef = useRef<number | null>(null);
  const isHome = pathname === "/";
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined" || isHome) {
      return;
    }

    const goHome = () => {
      if (pathname === "/") return;

      const navigate = () => {
        try {
          router.replace("/");
        } catch (error) {
          console.error("Idle redirect failed via router.replace, falling back", error);
          window.location.replace("/");
        }
      };

      if (typeof startTransition === "function") {
        startTransition(navigate);
      } else {
        navigate();
      }
    };

    const resetTimer = () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = window.setTimeout(goHome, IDLE_TIMEOUT_MS);
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        resetTimer();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest("button, [role='button']");
      if (button) {
        resetTimer();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest("button, [role='button']");
      if (button || event.key === "Enter" || event.key === " ") {
        resetTimer();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibility);

    resetTimer();

    return () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [router, pathname, isHome]);

  return (
    <div className="kiosk-root">
      <AnimatedBackground />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={shouldReduceMotion ? "static" : pathname}
          className={`kiosk-frame ${className}`}
          initial={
            shouldReduceMotion
              ? false
              : { opacity: 0, y: 22, scale: 0.988, filter: "blur(6px)" }
          }
          animate={
            shouldReduceMotion
              ? { opacity: 1 }
              : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
          }
          exit={
            shouldReduceMotion
              ? { opacity: 1 }
              : { opacity: 0, y: -16, scale: 0.99, filter: "blur(6px)" }
          }
          transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

