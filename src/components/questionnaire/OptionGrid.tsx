"use client";

import React from "react";

import OptionButton from "./OptionButton";
import type { QuestionDefinition } from "@/lib/questionnaire";

interface OptionGridProps {
  question: QuestionDefinition;
  selectedValues: string[];
  onToggle: (value: string) => void;
  emptyMessage: string;
}

const OptionGrid: React.FC<OptionGridProps> = ({
  question,
  selectedValues,
  onToggle,
  emptyMessage,
}) => {
  const reachedLimit =
    question.type === "multiple" &&
    typeof question.maxSelections === "number" &&
    selectedValues.length >= question.maxSelections;

  return (
    <div className="grid w-full max-w-[900px] grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {question.options.map((option, index) => {
        const isSelected = selectedValues.includes(option.value);
        const disabled = !isSelected && reachedLimit;
        const delayClass = index % 3 === 1 ? "animate-delay-1" : index % 3 === 2 ? "animate-delay-2" : "animate-delay-0";

        return (
          <OptionButton
            key={option.value}
            option={option}
            isSelected={isSelected}
            disabled={disabled}
            delayClass={delayClass}
            onClick={() => onToggle(option.value)}
          />
        );
      })}

      {question.options.length === 0 && (
        <div className="col-span-full flex h-full items-center justify-center rounded-3xl border border-white/15 bg-white/10 text-sm text-muted">
          {emptyMessage}
        </div>
      )}
    </div>
  );
};

export default OptionGrid;
