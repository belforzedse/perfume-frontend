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
  const isHome = pathname === "/";

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
      <div className={`kiosk-frame ${className}`}>{children}</div>
    </div>
  );
}

