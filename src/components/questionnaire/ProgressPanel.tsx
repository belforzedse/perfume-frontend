"use client";

import React from "react";


export interface SummaryChip {
  text: string;
  stepIndex: number;
  active?: boolean;


interface ProgressPanelProps {
  isReview?: boolean;
  progressLabel: string;
  progressPercent: number;
  progressPercentLabel: string;

  title: string;
  description?: string | null;

  limitMessage?: string | null;
  optional?: boolean;
  optionalLabel?: string;
  summaryHeading: string;
  summaryButtonLabel?: string;
  summaryChips: SummaryChip[];
  onSummaryClick?: () => void;
  onSelectSummaryChip?: (stepIndex: number) => void;
  onResetCurrent?: () => void;
  onResetAll?: () => void;

  resetCurrentLabel?: string;
  resetAllLabel?: string;

}

const ProgressPanel: React.FC<ProgressPanelProps> = ({
  isReview = false,
  progressLabel,
  progressPercent,
  progressPercentLabel,
  title,
  description,
  limitMessage,
  optional,
  optionalLabel,
  summaryHeading,
  summaryButtonLabel,
  summaryChips,
  onSummaryClick,
  onSelectSummaryChip,
  onResetCurrent,
  onResetAll,

  resetCurrentLabel,
  resetAllLabel,
}) => {
  const showResetRow = Boolean((onResetCurrent && resetCurrentLabel) || (onResetAll && resetAllLabel));

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 text-right">
          <div className="flex items-center justify-between gap-2 text-xs text-muted">
            <span>{progressLabel}</span>
            <div className="flex items-center gap-2">
              {!isReview && optional && optionalLabel && (
                <span className="rounded-full border border-white/25 px-2 py-0.5 text-[10px] text-[var(--color-accent)]">
                  {optionalLabel}
                </span>
              )}
              {onSummaryClick && (
                <button
                  type="button"
                  onClick={onSummaryClick}
                  className="rounded-full border border-white/25 px-3 py-1 text-[11px] text-muted transition-colors hover:border-white/35 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent tap-highlight"
                >
                  {summaryButtonLabel ?? summaryHeading}
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="m-0 text-2xl font-semibold text-[var(--color-foreground)]">{title}</h1>
            {description && <p className="m-0 text-sm text-muted">{description}</p>}
            {!isReview && limitMessage && (
              <p className="m-0 text-xs text-[var(--color-accent)]">{limitMessage}</p>
            )}
          </div>
        </div>

        {summaryChips.length > 0 && (
          <div className="flex flex-col items-end gap-2 text-[11px] text-muted">
            <span className="rounded-full border border-white/25 px-3 py-1 font-semibold text-[var(--color-accent-strong)]">
              {summaryHeading}
            </span>
            <div className="flex flex-wrap justify-end gap-2">
              {summaryChips.map((chip) =>
                onSelectSummaryChip ? (
                  <button
                    key={`${chip.stepIndex}-${chip.text}`}
                    type="button"
                    onClick={() => onSelectSummaryChip(chip.stepIndex)}
                    className={`rounded-full border px-3 py-1 text-right transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                      chip.active
                        ? "border-[var(--color-accent)] bg-[var(--accent-soft)] text-[var(--color-accent-strong)]"
                        : "border-white/20 bg-white/10 text-[var(--foreground-muted)] hover:border-white/30 hover:bg-white/15"
                    }`}
                    aria-current={chip.active ? "step" : undefined}
                  >
                    {chip.text}
                  </button>
                ) : (
                  <span
                    key={`${chip.stepIndex}-${chip.text}`}
                    className={`rounded-full border px-3 py-1 text-right ${
                      chip.active
                        ? "border-[var(--color-accent)] bg-[var(--accent-soft)] text-[var(--color-accent-strong)]"
                        : "border-white/20 bg-white/10 text-[var(--foreground-muted)]"
                    }`}
                  >
                    {chip.text}
                  </span>
                )
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 transition-[width] duration-500"
            style={{ width: `${progressPercent}%` }}
            aria-hidden
          />
          <span className="sr-only">{progressPercentLabel}</span>
        </div>
        <span className="text-[11px] font-semibold text-[var(--color-accent-strong)]">{progressPercentLabel}</span>
      </div>

      {showResetRow && (
        <div className="flex flex-wrap items-center justify-end gap-2 text-[11px] text-muted">
          {onResetCurrent && resetCurrentLabel && (
            <button
              type="button"
              onClick={onResetCurrent}
              className="rounded-full border border-white/20 px-3 py-1 transition-colors hover:border-white/30 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              {resetCurrentLabel}
            </button>
          )}
          {onResetAll && resetAllLabel && (
            <button
              type="button"
              onClick={onResetAll}
              className="rounded-full border border-white/20 px-3 py-1 transition-colors hover:border-white/30 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              {resetAllLabel}
            </button>
          )}

        </div>
      )}

      <ol className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1" aria-label="پیشرفت پرسشنامه">
        {steps.map((step, index) => {
          const statusBadge =
            step.status === "current"
              ? "bg-[var(--accent-soft)] text-[var(--color-accent)] border-[var(--color-accent)]"
              : step.status === "complete"
                ? "bg-emerald-100/15 text-emerald-200 border-emerald-200/40"
                : "bg-white/6 text-muted border-white/15";

          return (
            <li
              key={`${step.title}-${index}`}
              className={`rounded-2xl border px-3 py-2 text-xs leading-5 transition-colors ${statusBadge}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[var(--color-foreground)]">{step.title}</span>
                {step.optional && <span className="text-[10px] text-muted">{optionalLabel}</span>}
              </div>
              <span className="text-[11px] text-muted">
                {step.status === "current"
                  ? "در حال پاسخ دادن"
                  : step.status === "complete"
                    ? "پاسخ تکمیل شد"
                    : "منتظر پاسخ"}
              </span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
};

export default ProgressPanel;
