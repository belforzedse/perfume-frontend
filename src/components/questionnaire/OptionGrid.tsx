"use client";

import React, { useEffect, useMemo, useState } from "react";

import OptionButton from "./OptionButton";
import type { QuestionDefinition } from "@/lib/questionnaire";

interface OptionGridProps {
  question: QuestionDefinition;
  selectedValues: string[];
  onToggle: (value: string) => void;
  emptyMessage: string;
}

const navButtonClasses =
  "rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-white/30 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-40 disabled:hover:bg-white/10";

const OptionGrid: React.FC<OptionGridProps> = ({
  question,
  selectedValues,
  onToggle,
  emptyMessage,
}) => {
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [question.key]);

  const totalOptions = question.options.length;
  const denseThreshold = totalOptions > 6 ? 3 : 4;
  const itemsPerPage = Math.max(1, Math.min(denseThreshold, totalOptions || denseThreshold));
  const totalPages = Math.max(1, Math.ceil(totalOptions / itemsPerPage));

  useEffect(() => {
    if (page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  const visibleOptions = useMemo(
    () => question.options.slice(page * itemsPerPage, page * itemsPerPage + itemsPerPage),
    [itemsPerPage, page, question.options]
  );

  const reachedLimit =
    question.type === "multiple" &&
    typeof question.maxSelections === "number" &&
    selectedValues.length >= question.maxSelections;

  const handlePrev = () => setPage((current) => Math.max(current - 1, 0));
  const handleNext = () => setPage((current) => Math.min(current + 1, totalPages - 1));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3">
        {visibleOptions.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          const disabled = !isSelected && reachedLimit;

          return (
            <OptionButton
              key={option.value}
              option={option}
              isSelected={isSelected}
              disabled={disabled}
              onClick={() => onToggle(option.value)}
            />
          );
        })}

        {totalOptions === 0 && (
          <div className="col-span-full flex h-full items-center justify-center rounded-3xl border border-white/15 bg-white/8 p-8 text-sm text-muted">
            {emptyMessage}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-xs text-muted" aria-label="صفحه‌بندی گزینه‌ها">
          <button type="button" onClick={handlePrev} disabled={page === 0} className={navButtonClasses}>
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
          <button type="button" onClick={handleNext} disabled={page === totalPages - 1} className={navButtonClasses}>
            بعدی
          </button>
        </div>
      )}
    </div>
  );
};

export default OptionGrid;
