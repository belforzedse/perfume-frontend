"use client";

import React from "react";

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
  like: "bg-[var(--accent-soft)] border-[var(--color-accent)] text-[var(--color-accent)]",
  dislike: "bg-rose-100/10 border-rose-200/40 text-rose-100",
  neutral: "bg-white/6 border-white/15 text-[var(--color-foreground)]",
};

const BUTTON_BASE =
  "flex flex-1 items-center justify-center gap-1 rounded-full border px-3 py-2 text-xs font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent tap-highlight touch-target";

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
  const likeLimit = typeof maxLikes === "number" ? Math.max(maxLikes, 0) : Number.POSITIVE_INFINITY;
  const dislikeLimit =
    typeof maxDislikes === "number" ? Math.max(maxDislikes, 0) : Number.POSITIVE_INFINITY;

  const reachedLikeLimit = likes.length >= likeLimit;
  const reachedDislikeLimit = dislikes.length >= dislikeLimit;

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
    if (next === "like" && reachedLikeLimit && !likes.includes(value)) {
      return;
    }
    if (next === "dislike" && reachedDislikeLimit && !dislikes.includes(value)) {
      return;
    }
    onChange(value, next);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {options.map((option) => {
        const status = resolveStatus(option.value);
        const likeDisabled = reachedLikeLimit && status !== "like";
        const dislikeDisabled = reachedDislikeLimit && status !== "dislike";
        const neutralDisabled = status === "neutral";

        return (
          <div
            key={option.value}
            className="flex flex-col gap-3 rounded-3xl border border-white/12 bg-white/6 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div className="flex items-center justify-between gap-3 sm:justify-start">
              {option.icon && (
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12 text-xl">
                  {option.icon}
                </span>
              )}
              <div className="text-right">
                <span className="block text-sm font-semibold text-[var(--color-foreground)]">
                  {option.label}
                </span>
                <span className="text-[11px] text-muted">{neutralDescription}</span>
              </div>
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                onClick={() => handleToggle(option.value, "like")}
                disabled={likeDisabled}
                aria-pressed={status === "like"}
                className={`${BUTTON_BASE} ${STATUS_CLASS[status === "like" ? "like" : "neutral"]} ${
                  likeDisabled && status !== "like" ? "opacity-50" : ""
                }`}
              >
                <span role="img" aria-hidden>
                  💛
                </span>
                {likeLabel}
              </button>
              <button
                type="button"
                onClick={() => handleToggle(option.value, "dislike")}
                disabled={dislikeDisabled}
                aria-pressed={status === "dislike"}
                className={`${BUTTON_BASE} ${STATUS_CLASS[status === "dislike" ? "dislike" : "neutral"]} ${
                  dislikeDisabled && status !== "dislike" ? "opacity-50" : ""
                }`}
              >
                <span role="img" aria-hidden>
                  🚫
                </span>
                {dislikeLabel}
              </button>
              <button
                type="button"
                onClick={() => handleToggle(option.value, "neutral")}
                disabled={neutralDisabled}
                aria-pressed={status === "neutral"}
                className={`${BUTTON_BASE} ${STATUS_CLASS[status === "neutral" ? "neutral" : "neutral"]} ${
                  neutralDisabled ? "opacity-50" : ""
                }`}
              >
                {neutralLabel}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotePreferenceGrid;
