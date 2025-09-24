"use client";

import React from "react";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function KioskFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="kiosk-root">
      <AnimatedBackground />
      <div className={`kiosk-frame ${className}`}>{children}</div>
    </div>
  );
}

