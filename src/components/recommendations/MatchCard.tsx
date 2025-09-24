"use client";

import React from "react";
import Image from "next/image";

import TouchRipple from "@/components/TouchRipple";
import type { MatchQuality, RankedPerfume } from "@/lib/recommendation-engine";

export type CompactMode = "normal" | "tight" | "ultra";

export interface DisplayReason {
  text: string;
  tone: "positive" | "warning";
}

interface MatchCardProps {
  perfume: RankedPerfume;
  order: number;
  compact?: CompactMode;
  reasons: DisplayReason[];
  matchPercentLabel: string;
  matchQuality: MatchQuality;
  coveragePercent: number;
  coverageLabel: string;
  intensityLabel: string;
}

const CARD_IMAGE_HEIGHT: Record<CompactMode, string> = {
  normal: "min(26vh, 180px)",
  tight: "min(22vh, 150px)",
  ultra: "min(18vh, 120px)",
};

const CARD_BADGE_LIMIT: Record<CompactMode, number> = {
  normal: 3,
  tight: 2,
  ultra: 1,
};

const CARD_REASON_LIMIT: Record<CompactMode, number> = {
  normal: 3,
  tight: 2,
  ultra: 1,
};

const QUALITY_TONE_CLASS: Record<MatchQuality["tone"], string> = {
  great: "text-emerald-300",
  good: "text-amber-200",
  fair: "text-sky-200",
  light: "text-muted",
};

const REASON_TONE_CLASS: Record<DisplayReason["tone"], string> = {
  positive: "text-muted",
  warning: "text-rose-200",
};

const MatchCard: React.FC<MatchCardProps> = ({
  perfume,
  order,
  compact = "normal",
  reasons,
  matchPercentLabel,
  matchQuality,
  coveragePercent,
  coverageLabel,
  intensityLabel,
}) => {
  const title = perfume.nameFa && perfume.nameFa.trim().length > 0 ? perfume.nameFa : perfume.nameEn;
  const subtitle = [perfume.brand, perfume.collection]
    .filter((value): value is string => !!value && value.trim().length > 0)
    .join(" • ");

  const imageHeight = CARD_IMAGE_HEIGHT[compact];
  const badgeLimit = CARD_BADGE_LIMIT[compact];
  const reasonLimit = CARD_REASON_LIMIT[compact];

  const badges = [perfume.family, perfume.character, perfume.season, intensityLabel]
    .filter((value): value is string => !!value && value.trim().length > 0)
    .slice(0, badgeLimit);

  const visibleReasons = reasons.slice(0, reasonLimit);
  const notePreview = perfume.allNotes.slice(0, compact === "ultra" ? 2 : 4);

  const [expanded, setExpanded] = React.useState(false);
  const articleRef = React.useRef<HTMLDivElement>(null);
  const emitRipple = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const node = articleRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const ripple = (TouchRipple as unknown as { emit?: (x: number, y: number) => void }).emit;
    ripple?.(event.clientX - rect.left, event.clientY - rect.top);
  }, []);

  const toggleExpanded = React.useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleExpanded();
      }
    },
    [toggleExpanded]
  );

  return (
    <article
      ref={articleRef}
      role="button"
      tabIndex={0}
      onPointerDown={emitRipple}
      onClick={toggleExpanded}
      onKeyDown={handleKeyDown}
      aria-expanded={expanded}
      aria-label={`${title ?? ""} - درصد تطابق ${matchPercentLabel}`}
      className="interactive-card glass-card relative flex h-full flex-col justify-between rounded-2xl p-4 text-right animate-fade-in-up tap-highlight touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
    >
      <TouchRipple />
      <header className="flex items-start justify-between">
        <span className="rounded-full bg-soft px-3 py-1 text-xs font-semibold text-muted">{order}</span>
        <div className="text-right">
          <span className="block text-sm font-semibold text-[var(--color-accent)]">{matchPercentLabel}</span>
          <span className={`text-[11px] font-medium ${QUALITY_TONE_CLASS[matchQuality.tone]}`}>
            {matchQuality.label}
          </span>
        </div>
      </header>

      {perfume.image && (
        <div className="my-2 flex flex-grow justify-center">
          <div className="relative w-full flex-grow overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm" style={{ height: imageHeight }}>
            <Image
              src={perfume.image}
              alt={title}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          </div>
        </div>
      )}

      <div className="space-y-1">
        <h3 className={`font-semibold text-[var(--color-foreground)] ${compact === "ultra" ? "text-lg" : "text-xl"} line-clamp-1`}>
          {title}
        </h3>
        {compact !== "ultra" && perfume.nameEn && (
          <p className="m-0 text-xs italic text-subtle line-clamp-1">{perfume.nameEn}</p>
        )}
        {compact === "normal" && subtitle && (
          <p className="m-0 text-xs text-muted line-clamp-1">{subtitle}</p>
        )}
      </div>

      {badges.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-end gap-2 text-[10px] sm:text-xs text-muted">
          {badges.map((badge, index) => (
            <span key={index} className="badge-soft">
              {badge}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between text-[11px] text-muted">
          <span>{coverageLabel}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300"
            style={{ width: `${coveragePercent}%` }}
          />
        </div>
      </div>

      {visibleReasons.length > 0 && (
        <ul className="mt-3 space-y-1 text-[11px] sm:text-xs">
          {visibleReasons.map((reason, index) => (
            <li key={index} className={`line-clamp-2 ${REASON_TONE_CLASS[reason.tone]}`}>
              {reason.text}
            </li>
          ))}
        </ul>
      )}

      {notePreview.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-end gap-2 text-[10px] sm:text-xs text-muted">
          {notePreview.map((note, index) => (
            <span key={index} className="rounded-full border border-white/15 bg-white/8 px-2.5 py-1">
              {note}
            </span>
          ))}
        </div>
      )}

      {expanded && perfume.allNotes.length > 0 && (
        <div className="mt-3 rounded-2xl border border-white/12 bg-white/8 p-3 text-[11px] text-muted">
          <p className="m-0 text-[11px] text-[var(--color-foreground)]">نُت‌های کامل:</p>
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            {perfume.allNotes.map((note, index) => (
              <span key={index} className="rounded-full bg-white/10 px-2 py-1">
                {note}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};

export default MatchCard;
