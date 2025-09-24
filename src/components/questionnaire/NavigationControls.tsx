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
    <footer className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-md animate-slide-in-left animate-delay-3 lg:flex-row lg:items-center lg:justify-between">
      {helperText && (
        <span className="text-xs text-muted" aria-live="polite">
          {isOptional ? (
            <span className="text-[var(--color-accent)]">{helperText}</span>
          ) : (
            helperText
          )}
        </span>
      )}
      <div className="flex w-full items-center justify-between gap-3 lg:w-auto lg:justify-end">
        {showBack && (
          <button
            onClick={onBack}
            disabled={disableBack}
            className="btn-ghost w-full lg:w-32 tap-highlight touch-target touch-feedback"
          >
            {backLabel}
          </button>
        )}
        {showNext && (
          <button
            onClick={onNext}
            disabled={disableNext}
            className="btn w-full lg:w-36 tap-highlight touch-target touch-feedback"
          >
            {nextLabel}
          </button>
        )}
      </div>
    </footer>
  );
};

export default NavigationControls;
