"use client";

import React from "react";

import type { Choice } from "@/lib/kiosk-options";

const BASE_CLASSES =
  "relative flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-3xl border px-4 py-4 text-center text-base font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent tap-highlight touch-target";

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
  const visualState = isSelected
    ? "border-[var(--color-accent)] bg-[var(--accent-soft)] text-[var(--color-accent)] shadow-soft"
    : "border-white/20 bg-white/4 text-[var(--color-foreground)] hover:border-white/35 hover:bg-white/10";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isSelected}
      className={[
        BASE_CLASSES,
        delayClass,
        visualState,
        disabled ? "cursor-not-allowed opacity-55" : "",
      ].join(" ")}
    >
      <span className="relative flex flex-col items-center gap-1">
        {option.icon && <span className="text-2xl sm:text-[26px]">{option.icon}</span>}
        <span className="text-sm leading-6 sm:text-base">{option.label}</span>
      </span>
    </button>
  );
};

export default OptionButton;
