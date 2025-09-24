"use client";

import React from "react";

import TouchRipple from "@/components/TouchRipple";
import type { Choice } from "@/lib/kiosk-options";

const BTN_BASE =
  "group relative overflow-hidden rounded-3xl border-2 px-4 py-5 text-center text-lg font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-transparent tap-highlight touch-target";

interface OptionButtonProps {
  option: Choice;
  isSelected: boolean;
  disabled?: boolean;
  delayClass?: string;
  onClick: () => void;
}

const OptionButton: React.FC<OptionButtonProps> = ({
  option,
  isSelected,
  disabled = false,
  delayClass = "",
  onClick,
}) => {
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const node = buttonRef.current;
      const ripple = (TouchRipple as unknown as { emit?: (x: number, y: number) => void }).emit;
      if (!node || !ripple) return;
      const rect = node.getBoundingClientRect();
      ripple(event.clientX - rect.left, event.clientY - rect.top);
    },
    []
  );

  const visualState = isSelected
    ? "border-[var(--color-accent)] bg-[var(--accent-soft)] text-[var(--color-accent)] shadow-strong"
    : "border-white/25 bg-white/6 text-[var(--color-foreground)] hover:border-white/40 hover:bg-white/15";

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      disabled={disabled}
      aria-pressed={isSelected}
      className={[
        BTN_BASE,
        delayClass,
        visualState,
        disabled ? "cursor-not-allowed opacity-55" : "active:scale-95",
      ].join(" ")}
    >
      <TouchRipple />
      <span className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-white/12 to-transparent opacity-0 transition-opacity duration-200 group-aria-pressed:opacity-100 group-focus-visible:opacity-100" />
      <span className="relative flex flex-col items-center gap-1">
        {option.icon && <span className="text-2xl sm:text-[28px]">{option.icon}</span>}
        <span className="text-sm font-medium leading-6 sm:text-base">{option.label}</span>
      </span>
    </button>
  );
};

export default OptionButton;
