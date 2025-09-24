"use client";

import React, { startTransition, useEffect, useRef } from "react";
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
  const idleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

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

    const passiveEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "pointermove",
      "pointerup",
      "touchstart",
      "touchmove",
      "wheel",
    ];
    const activeEvents: Array<keyof WindowEventMap> = ["keydown"];

    passiveEvents.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }));
    activeEvents.forEach((eventName) => window.addEventListener(eventName, resetTimer));
    document.addEventListener("visibilitychange", handleVisibility);

    resetTimer();

    return () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      passiveEvents.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
      activeEvents.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
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

