"use client";

import React, { useEffect, useMemo, useState } from "react";


import type { Choice } from "@/lib/kiosk-options";

export type NotePreferenceValue = "like" | "dislike" | "neutral";

interface NotePreferenceGridProps {
  options: Choice[];
  likes: string[];
  dislikes: string[];
  maxLikes?: number;
  maxDislikes?: number;
  likeLabel: string;
  dislikeLabel: string;
  neutralLabel: string;
  neutralDescription: string;
  onChange: (value: string, preference: NotePreferenceValue) => void;
}

const STATUS_CLASS: Record<NotePreferenceValue, string> = {
  like: "border-[var(--color-accent)] bg-[var(--accent-soft)] text-[var(--color-accent)]",
  dislike: "border-rose-200/50 bg-rose-200/15 text-rose-100",
  neutral: "border-white/20 bg-white/6 text-[var(--color-foreground)]",
};

const BUTTON_BASE =
  "flex-1 rounded-full border px-3 py-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-40 tap-highlight touch-target";

const pagerButton =
  "rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-white/30 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-40";


const NotePreferenceGrid: React.FC<NotePreferenceGridProps> = ({
  options,
  likes,
  dislikes,
  maxLikes,
  maxDislikes,
  likeLabel,
  dislikeLabel,
  neutralLabel,
  neutralDescription,
  onChange,
}) => {

  const [page, setPage] = useState(0);

  useEffect(() => setPage(0), [options]);

  const likeLimit = typeof maxLikes === "number" ? Math.max(maxLikes, 0) : Number.POSITIVE_INFINITY;
  const dislikeLimit = typeof maxDislikes === "number" ? Math.max(maxDislikes, 0) : Number.POSITIVE_INFINITY;


  const reachedLikeLimit = likes.length >= likeLimit;
  const reachedDislikeLimit = dislikes.length >= dislikeLimit;


  const itemsPerPage = Math.max(1, Math.min(4, options.length || 4));
  const totalPages = Math.max(1, Math.ceil(options.length / itemsPerPage));

  useEffect(() => {
    if (page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  const visibleOptions = useMemo(
    () => options.slice(page * itemsPerPage, page * itemsPerPage + itemsPerPage),
    [itemsPerPage, options, page]
  );


  const resolveStatus = (value: string): NotePreferenceValue => {
    if (likes.includes(value)) return "like";
    if (dislikes.includes(value)) return "dislike";
    return "neutral";
  };

  const handleToggle = (value: string, next: NotePreferenceValue) => {
    const current = resolveStatus(value);
    if (current === next) {
      onChange(value, "neutral");
      return;
    }

    if (next === "like" && reachedLikeLimit && current !== "like") return;
    if (next === "dislike" && reachedDislikeLimit && current !== "dislike") return;
    onChange(value, next);
  };

  const handlePrev = () => setPage((current) => Math.max(current - 1, 0));
  const handleNext = () => setPage((current) => Math.min(current + 1, totalPages - 1));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {visibleOptions.map((option) => {
          const status = resolveStatus(option.value);
          const likeDisabled = reachedLikeLimit && status !== "like";
          const dislikeDisabled = reachedDislikeLimit && status !== "dislike";
          const neutralDisabled = status === "neutral";

          return (
            <div
              key={option.value}
              className="flex flex-col gap-3 rounded-3xl border border-white/15 bg-white/6 p-4 text-right"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {option.icon && (
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-xl">
                      {option.icon}
                    </span>
                  )}
                  <div>
                    <p className="m-0 text-sm font-semibold text-[var(--color-foreground)]">{option.label}</p>
                    <p className="m-0 text-[11px] text-muted">{neutralDescription}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleToggle(option.value, "like")}
                  disabled={likeDisabled}
                  aria-pressed={status === "like"}
                  className={`${BUTTON_BASE} ${STATUS_CLASS[status === "like" ? "like" : "neutral"]}`}
                >
                  {likeLabel}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(option.value, "neutral")}
                  disabled={neutralDisabled}
                  aria-pressed={status === "neutral"}
                  className={`${BUTTON_BASE} ${STATUS_CLASS[status === "neutral" ? "neutral" : "neutral"]}`}
                >
                  {neutralLabel}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(option.value, "dislike")}
                  disabled={dislikeDisabled}
                  aria-pressed={status === "dislike"}
                  className={`${BUTTON_BASE} ${STATUS_CLASS[status === "dislike" ? "dislike" : "neutral"]}`}
                >
                  {dislikeLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-xs text-muted">
          <button type="button" onClick={handlePrev} disabled={page === 0} className={pagerButton}>
            قبلی
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setPage(index)}
                aria-label={`صفحه ${index + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  index === page ? "bg-[var(--color-accent)]" : "bg-white/25 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
          <button type="button" onClick={handleNext} disabled={page === totalPages - 1} className={pagerButton}>
            بعدی
          </button>
        </div>
      )}

    </div>
  );
};

export default NotePreferenceGrid;
