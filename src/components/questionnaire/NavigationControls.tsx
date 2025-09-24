"use client";

import React from "react";

interface NavigationControlsProps {
  onBack: () => void;
  onNext: () => void;
  disableBack: boolean;
  disableNext: boolean;
  backLabel: string;
  nextLabel: string;
  helperText: string;
  isOptional: boolean;
}

const NavigationControls: React.FC<NavigationControlsProps> = ({
  onBack,
  onNext,
  disableBack,
  disableNext,
  backLabel,
  nextLabel,
  helperText,
  isOptional,
}) => {
  return (
    <footer className="flex items-center justify-between gap-3 animate-slide-in-left animate-delay-3">
      <button
        onClick={onBack}
        disabled={disableBack}
        className="btn-ghost w-32 tap-highlight touch-target touch-feedback"
      >
        {backLabel}
      </button>
      <span className="text-xs text-muted" aria-live="polite">
        {isOptional ? (
          <span className="text-[var(--color-accent)]">{helperText}</span>
        ) : (
          helperText
        )}
      </span>
      <button
        onClick={onNext}
        disabled={disableNext}
        className="btn w-36 tap-highlight touch-target touch-feedback"
      >
        {nextLabel}
      </button>
    </footer>
  );
};

export default NavigationControls;
