"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toPersianNumbers } from "@/lib/api";
import { useRouter } from "next/navigation";
import KioskFrame from "@/components/KioskFrame";
import {
  QUESTION_FLOW,
  QuestionnaireAnswers,
  QuestionDefinition,
  TOTAL_QUESTIONS,
  createInitialAnswers,
  serializeAnswers,
} from "@/lib/questionnaire";

const BTN_BASE =
  "question-option text-base sm:text-lg font-semibold animate-fade-in-up transition-transform duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(255,255,255,0.45)] tap-highlight touch-target touch-feedback";

const formatNumber = (value: number) => toPersianNumbers(String(value));

const toggleSelection = (
  previous: QuestionnaireAnswers,
  question: QuestionDefinition,
  value: string
): { next: QuestionnaireAnswers; limited: boolean } => {
  const key = question.key;
  const currentValues = previous[key];
  const isSelected = currentValues.includes(value);

  if (question.type === "single") {
    return {
      next: { ...previous, [key]: isSelected ? [] : [value] },
      limited: false,
    };
  }

  if (
    !isSelected &&
    typeof question.maxSelections === "number" &&
    currentValues.length >= question.maxSelections
  ) {
    return { next: previous, limited: true };
  }

  const nextValues = isSelected
    ? currentValues.filter((item) => item !== value)
    : [...currentValues, value];

  return {
    next: { ...previous, [key]: nextValues },
    limited: false,
  };
};

const buildHelperText = (
  question: QuestionDefinition,
  selectedCount: number,
  limitReached: boolean,
  limitMessage: string | null
) => {
  if (limitMessage) return limitMessage;

  if (question.type === "multiple" && question.maxSelections) {
    const limit = formatNumber(question.maxSelections);
    if (selectedCount === 0) {
      return question.optional
        ? `می‌توانید حداکثر ${limit} مورد را به صورت اختیاری انتخاب کنید.`
        : `برای ادامه بین ۱ تا ${limit} گزینه انتخاب کنید.`;
    }
    const selected = formatNumber(selectedCount);
    return limitReached
      ? `حداکثر ${limit} مورد انتخاب شده است.`
      : `انتخاب شده: ${selected} از ${limit}`;
  }

  if (selectedCount === 0) {
    return question.optional
      ? "این سوال اختیاری است."
      : "برای ادامه لطفاً یک گزینه را انتخاب کنید.";
  }

  return "آماده ادامه هستید.";
};

export default function Questionnaire() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(() => createInitialAnswers());
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const autoAdvanceTimerRef = useRef<number | null>(null);

  const questions = QUESTION_FLOW;
  const currentQuestion = questions[currentStep];
  const totalQuestions = questions.length;

  useEffect(() => {
    setLimitMessage(null);
    if (autoAdvanceTimerRef.current) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }, [currentQuestion]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        window.clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
  }, []);

  const next = useCallback(
    (overrideAnswers?: QuestionnaireAnswers) => {
      const answersToUse = overrideAnswers ?? answers;
      if (currentStep < totalQuestions - 1) {
        setCurrentStep((s) => Math.min(s + 1, totalQuestions - 1));
      } else {
        const qs = new URLSearchParams({ answers: serializeAnswers(answersToUse) });
        router.push(`/recommendations?${qs.toString()}`);
      }
    },
    [answers, currentStep, router, totalQuestions]
  );

  const toggle = useCallback(
    (value: string) => {
      if (autoAdvanceTimerRef.current) {
        window.clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }

      let shouldAutoAdvance = false;
      let updatedAnswersSnapshot: QuestionnaireAnswers | null = null;

      setAnswers((prev) => {
        const wasSelected = prev[currentQuestion.key].includes(value);
        const { next: updatedAnswers, limited } = toggleSelection(prev, currentQuestion, value);
        if (limited) {
          if (currentQuestion.maxSelections) {
            const limit = formatNumber(currentQuestion.maxSelections);
            setLimitMessage(`حداکثر ${limit} انتخاب مجاز است.`);
          }
          return prev;
        }

        setLimitMessage(null);
        updatedAnswersSnapshot = updatedAnswers;

        const selectionCount = updatedAnswers[currentQuestion.key].length;
        const maxSelections =
          typeof currentQuestion.maxSelections === "number"
            ? currentQuestion.maxSelections
            : null;
        const reachedMax = maxSelections !== null && selectionCount === maxSelections;

        shouldAutoAdvance =
          !wasSelected &&
          ((currentQuestion.type === "single" && !currentQuestion.optional && selectionCount > 0) || reachedMax);

        return updatedAnswers;
      });

      if (shouldAutoAdvance && updatedAnswersSnapshot) {
        autoAdvanceTimerRef.current = window.setTimeout(() => {
          autoAdvanceTimerRef.current = null;
          next(updatedAnswersSnapshot!);
        }, 250);
      }
    },
    [currentQuestion, next]
  );

  const back = () => currentStep > 0 && setCurrentStep((s) => s - 1);

  const selectedCount = answers[currentQuestion.key].length;
  const limitReached = Boolean(
    currentQuestion.maxSelections && selectedCount >= currentQuestion.maxSelections
  );

  const canProceed = currentQuestion.optional || selectedCount > 0;

  const helperText = buildHelperText(
    currentQuestion,
    selectedCount,
    limitReached,
    limitMessage
  );

  const progress = Math.round(((currentStep + 1) / TOTAL_QUESTIONS) * 100);

  return (
    <KioskFrame>
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="glass-card relative flex h-full w-full max-w-[1200px] flex-col gap-6 rounded-[32px] px-6 py-6 animate-blur-in">
          <header className="flex items-center justify-between animate-slide-in-right">
            <div className="space-y-2 text-right">
              <p className="m-0 text-xs text-muted" aria-live="polite">
                سوال {formatNumber(currentStep + 1)} از {formatNumber(TOTAL_QUESTIONS)}
              </p>
              <h1 className="text-3xl font-semibold text-[var(--color-foreground)]">
                {currentQuestion.title}
              </h1>
              {currentQuestion.description && (
                <p className="m-0 text-sm text-muted">{currentQuestion.description}</p>
              )}
            </div>
            <div className="w-48">
              <div className="h-2 w-full rounded-full bg-soft">
                <div
                  className="h-2 rounded-full bg-[var(--color-accent)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </header>

          <section className="flex flex-1 items-center justify-center animate-scale-in animate-delay-2">
            <div className="grid w-full max-w-[900px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {currentQuestion.options.map((option, idx) => {
                const values = answers[currentQuestion.key];
                const isSelected = values.includes(option.value);
                const disabled =
                  !isSelected &&
                  typeof currentQuestion.maxSelections === "number" &&
                  values.length >= currentQuestion.maxSelections;
                const delayClass = idx % 3 === 1 ? "animate-delay-1" : idx % 3 === 2 ? "animate-delay-2" : "";
                return (
                  <button
                    key={option.value}
                    onClick={() => toggle(option.value)}
                    disabled={disabled}
                    aria-pressed={isSelected}
                    className={`${BTN_BASE} ${delayClass} ${
                      isSelected ? "question-option--selected" : "question-option--default"
                    } ${disabled ? "question-option--disabled" : ""}`}
                  >
                    {option.label}
                  </button>
                );
              })}
              {currentQuestion.options.length === 0 && (
                <div className="col-span-full flex h-full items-center justify-center text-sm text-muted">گزینه‌ای یافت نشد.</div>
              )}
            </div>
          </section>

          <footer className="flex items-center justify-between gap-3 animate-slide-in-left animate-delay-3">
            <button onClick={back} disabled={currentStep === 0} className="btn-ghost w-32 tap-highlight touch-target touch-feedback">
              بازگشت
            </button>
            <span className="text-xs text-muted" aria-live="polite">
              {helperText}
            </span>
            <button onClick={() => next()} disabled={!canProceed} className="btn w-32 tap-highlight touch-target touch-feedback">
              {currentStep === totalQuestions - 1 ? "مشاهده پیشنهادها" : "بعدی"}
            </button>
          </footer>
        </div>
      </div>
    </KioskFrame>
  );
}

