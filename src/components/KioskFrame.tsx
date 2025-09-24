"use client";

import React, { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const resetTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = setTimeout(() => {
        if (pathname !== "/") {
          router.replace("/");
        }
      }, IDLE_TIMEOUT_MS);
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        resetTimer();
      }
    };

    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "pointermove",
      "keydown",
      "touchstart",
      "mousemove",
    ];

    resetTimer();
    events.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }));
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [router, pathname]);

  return (
    <div className="kiosk-root">
      <AnimatedBackground />
      <div className={`kiosk-frame ${className}`}>{children}</div>
    </div>
  );
}

