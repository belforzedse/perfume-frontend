"use client";

import React from "react";

interface ProgressPanelProps {
  title: string;
  description?: string;
  progressLabel: string;
  progressPercent: number;
  progressPercentLabel: string;
  summaryHeading: string;
  summaryChips: string[];
  optional: boolean;
  optionalLabel: string;
  limitMessage?: string | null;
  onResetCurrent?: () => void;
  onResetAll?: () => void;
}

const ProgressPanel: React.FC<ProgressPanelProps> = ({
  title,
  description,
  progressLabel,
  progressPercent,
  summaryHeading,
  summaryChips,
  optional,
  optionalLabel,
  limitMessage,
  onResetCurrent,
  onResetAll,
  progressPercentLabel,
}) => {
  const hasActions = Boolean(onResetCurrent || onResetAll);

  return (
    <header className="flex flex-col gap-5 animate-slide-in-right">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2 text-right">
          <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted" aria-live="polite">
            <span>{progressLabel}</span>
            {optional && (
              <span className="rounded-full border border-white/30 px-2 py-0.5 text-[11px] text-[var(--color-accent)]">
                {optionalLabel}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-semibold text-[var(--color-foreground)]">{title}</h1>
          {description && <p className="m-0 text-sm text-muted">{description}</p>}
          {limitMessage && (
            <p className="m-0 text-xs text-[var(--color-accent)]" role="status">
              {limitMessage}
            </p>
          )}
        </div>

        <div className="flex w-full flex-col items-end gap-2 sm:w-56">
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 shadow-lg transition-[width] duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-[var(--color-accent)]">
            {progressPercentLabel}
          </span>
          {hasActions && (
            <div className="flex items-center gap-2 text-xs text-muted">
              {onResetCurrent && (
                <button
                  type="button"
                  onClick={onResetCurrent}
                  className="btn-ghost px-3 py-1 text-xs tap-highlight touch-target"
                >
                  پاک کردن این سوال
                </button>
              )}
              {onResetAll && (
                <button
                  type="button"
                  onClick={onResetAll}
                  className="btn-ghost px-3 py-1 text-xs tap-highlight touch-target"
                >
                  شروع دوباره
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {summaryChips.length > 0 && (
        <div
          className="flex flex-wrap justify-end gap-2 text-xs text-muted"
          aria-live="polite"
          aria-label={summaryHeading}
        >
          <span className="rounded-full border border-white/25 px-3 py-1 font-semibold text-[var(--color-accent)]">
            {summaryHeading}
          </span>
          {summaryChips.map((chip, index) => (
            <span key={index} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs">
              {chip}
            </span>
          ))}
        </div>
      )}
    </header>
  );
};

export default ProgressPanel;
