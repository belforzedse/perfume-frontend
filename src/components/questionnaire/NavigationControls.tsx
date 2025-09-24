"use client";

import React from "react";

interface NavigationControlsProps {
  onBack?: () => void;
  onNext?: () => void;
  disableBack?: boolean;
  disableNext?: boolean;
  backLabel?: string;
  nextLabel?: string;
  helperText?: string | null;
  isOptional?: boolean;
  showBack?: boolean;
  showNext?: boolean;
}

const buttonBase =
  "flex-1 rounded-full border px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-40 tap-highlight touch-target";

const NavigationControls: React.FC<NavigationControlsProps> = ({
  onBack,
  onNext,
  disableBack = false,
  disableNext = false,
  backLabel = "بازگشت",
  nextLabel = "ادامه",
  helperText,
  isOptional = false,
  showBack = true,
  showNext = true,
}) => {
  return (
    <footer className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/6 p-4 shadow-sm">
      {helperText && (
        <span className={`text-xs ${isOptional ? "text-[var(--color-accent)]" : "text-muted"}`} aria-live="polite">
          {helperText}
        </span>
      )}
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={onBack}
            disabled={disableBack}
            className={`${buttonBase} border-white/20 bg-white/8 text-muted hover:border-white/30 hover:bg-white/12`}
          >
            {backLabel}
          </button>
        )}
        {showNext && (
          <button
            onClick={onNext}
            disabled={disableNext}
            className={`${buttonBase} border-[var(--color-accent)] bg-[var(--color-accent)]/90 text-[var(--accent-contrast)] hover:bg-[var(--color-accent)]`}
          >
            {nextLabel}
          </button>
        )}
      </div>
    </footer>
  );
};

export default NavigationControls;
