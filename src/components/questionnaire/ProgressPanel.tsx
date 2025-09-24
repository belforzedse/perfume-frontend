"use client";

import React from "react";

interface SummaryChip {
  text: string;
  stepIndex: number;
  active: boolean;
}

interface StepIndicator {
  title: string;
  status: "complete" | "current" | "upcoming";
  optional: boolean;
}

interface ProgressPanelProps {
  title: string;
  description?: string;
  progressLabel: string;
  progressPercent: number;
  progressPercentLabel: string;
  summaryHeading: string;
  summaryChips: SummaryChip[];
  optional: boolean;
  optionalLabel: string;
  limitMessage?: string | null;
  onResetCurrent?: () => void;
  onResetAll?: () => void;
  onSelectStep?: (stepIndex: number) => void;
  steps: StepIndicator[];
  settingsSlot?: React.ReactNode;
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
  onSelectStep,
  steps,
  settingsSlot,
}) => {
  const hasActions = Boolean(onResetCurrent || onResetAll || settingsSlot);

  return (
    <aside className="flex h-full flex-col gap-6 animate-slide-in-right">
      <div className="space-y-3 text-right">
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

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 shadow-lg transition-[width] duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-[var(--color-accent)]">{progressPercentLabel}</span>
        </div>
        {hasActions && (
          <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-muted">
            {settingsSlot}
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

      {summaryChips.length > 0 && (
        <div className="space-y-2" aria-live="polite" aria-label={summaryHeading}>
          <span className="rounded-full border border-white/25 px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
            {summaryHeading}
          </span>
          <div className="flex flex-wrap justify-end gap-2 text-xs text-muted">
            {summaryChips.map((chip) => (
              <button
                key={`${chip.stepIndex}-${chip.text}`}
                type="button"
                onClick={() => onSelectStep?.(chip.stepIndex)}
                className={`rounded-full border px-3 py-1 transition-colors tap-highlight touch-target ${
                  chip.active
                    ? "border-[var(--color-accent)] bg-[var(--accent-soft)] text-[var(--color-accent)]"
                    : "border-white/20 bg-white/10 text-muted hover:border-white/30"
                }`}
                aria-current={chip.active ? "step" : undefined}
              >
                {chip.text}
              </button>
            ))}
          </div>
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
