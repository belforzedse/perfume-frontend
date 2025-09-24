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
    <div className="flex flex-col gap-3">
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
            className="flex items-start justify-between gap-4 rounded-2xl border border-white/12 bg-white/6 p-4 text-right"
          >
            <div className="space-y-1">
              <h3 className="m-0 text-sm font-semibold text-[var(--color-foreground)]">{question.title}</h3>
              {question.description && (
                <p className="m-0 text-[11px] text-muted">{question.description}</p>
              )}
              <p className="m-0 text-xs text-[var(--color-foreground)]">{summaryText}</p>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(index)}
              className="rounded-full border border-white/25 px-3 py-1 text-[11px] text-muted transition-colors hover:border-white/35 hover:bg-white/12 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent tap-highlight"
            >
              ویرایش
            </button>
          </article>
        );
      })}
    </div>
  );
};

export default ReviewStep;
