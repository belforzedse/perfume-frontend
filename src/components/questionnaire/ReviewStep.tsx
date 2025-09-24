"use client";

import React from "react";

import {
  type QuestionnaireAnswers,
  type QuestionDefinition,
  isNotePreferenceQuestion,
} from "@/lib/questionnaire";

interface ReviewStepProps {
  answers: QuestionnaireAnswers;
  questions: QuestionDefinition[];
  summaryLabels: Record<string, string>;
  emptyLabel: string;
  formatValues: (values: string[]) => string;
  onEditStep: (stepIndex: number) => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  answers,
  questions,
  summaryLabels,
  emptyLabel,
  formatValues,
  onEditStep,
}) => {
  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-y-auto pr-1">
      {questions.map((question, index) => {
        const values = answers[question.key];
        const isNoteQuestion = isNotePreferenceQuestion(question);
        const pairedValues = isNoteQuestion ? answers[question.pairedKey] : [];
        const hasValue = values.length > 0 || pairedValues.length > 0;

        const summaryParts: string[] = [];
        if (values.length > 0) {
          summaryParts.push(`${summaryLabels.likes}: ${formatValues(values)}`);
        }
        if (pairedValues.length > 0) {
          summaryParts.push(`${summaryLabels.dislikes}: ${formatValues(pairedValues)}`);
        }

        const summaryText = !hasValue
          ? emptyLabel
          : isNoteQuestion
            ? summaryParts.join(" • ")
            : formatValues(values);

        return (
          <article
            key={question.key}
            className="flex flex-col gap-3 rounded-3xl border border-white/12 bg-white/8 p-4 text-right shadow-sm"
          >
            <header className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[var(--color-foreground)]">
                  {question.title}
                </span>
                {question.description && (
                  <span className="text-[11px] text-muted">{question.description}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onEditStep(index)}
                className="btn-ghost shrink-0 rounded-full px-3 py-1 text-xs tap-highlight touch-target touch-feedback"
              >
                ویرایش
              </button>
            </header>
            <p className="m-0 rounded-2xl bg-white/6 px-3 py-2 text-xs text-[var(--color-foreground)]">
              {summaryText}
            </p>
          </article>
        );
      })}
    </div>
  );
};

export default ReviewStep;
