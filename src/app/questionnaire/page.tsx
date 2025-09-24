"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import KioskFrame from "@/components/KioskFrame";
import NavigationControls from "@/components/questionnaire/NavigationControls";
import OptionGrid from "@/components/questionnaire/OptionGrid";
import ProgressPanel from "@/components/questionnaire/ProgressPanel";
import { toPersianNumbers } from "@/lib/api";
import {
  TEXT,
  QUESTION_CONFIG,
  SUMMARY_PREVIEW_LIMIT,
  type QuestionnaireAnswers,
  initialAnswers,
  separatorJoin,
  sanitizeAnswers,
  areAnswersEqual,
  firstIncompleteStep,
} from "@/lib/questionnaire";

const Questionnaire: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const answersFromQuery = useMemo(() => {
    const param = searchParams.get("answers");
    if (!param) return null;
    try {
      const parsed = JSON.parse(param) as Partial<QuestionnaireAnswers>;
      return sanitizeAnswers(parsed);
    } catch (error) {
      console.warn("Invalid answers provided in query", error);
      return null;
    }
  }, [searchParams]);

  const initialState = answersFromQuery ?? initialAnswers();
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(initialState);
  const [currentStep, setCurrentStep] = useState(() => firstIncompleteStep(initialState));

  useEffect(() => {
    if (!answersFromQuery) return;
    setAnswers((prev) => (areAnswersEqual(prev, answersFromQuery) ? prev : answersFromQuery));
    setCurrentStep(firstIncompleteStep(answersFromQuery));
  }, [answersFromQuery]);

  const questions = QUESTION_CONFIG;
  const totalSteps = questions.length;
  const currentQuestion = questions[currentStep];
  const selectedValues = answers[currentQuestion.key];

  const encodedAnswers = useMemo(() => JSON.stringify(answers), [answers]);
  const hasAnswers = useMemo(
    () => questions.some((question) => answers[question.key].length > 0),
    [answers, questions]
  );

  useEffect(() => {
    if (!hasAnswers) {
      if (searchParams.get("answers")) {
        router.replace("/questionnaire", { scroll: false });
      }
      return;
    }

    const currentParam = searchParams.get("answers");
    if (currentParam === encodedAnswers) return;
    const query = new URLSearchParams({ answers: encodedAnswers }).toString();
    router.replace(`/questionnaire?${query}`, { scroll: false });
  }, [encodedAnswers, hasAnswers, router, searchParams]);

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((step) => Math.min(step + 1, totalSteps - 1));
      return;
    }

    const query = new URLSearchParams({ answers: JSON.stringify(sanitizeAnswers(answers)) }).toString();
    router.push(`/recommendations?${query}`);
  }, [answers, currentStep, router, totalSteps]);

  const goBack = useCallback(() => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }, []);

  const toggle = useCallback(
    (value: string) => {
      setAnswers((prev) => {
        const key = currentQuestion.key;
        const selected = prev[key];
        const isSelected = selected.includes(value);
        const atLimit =
          !isSelected &&
          currentQuestion.type === "multiple" &&
          typeof currentQuestion.maxSelections === "number" &&
          selected.length >= currentQuestion.maxSelections;

        if (currentQuestion.type === "single") {
          return { ...prev, [key]: isSelected ? [] : [value] };
        }

        if (atLimit) return prev;
        return {
          ...prev,
          [key]: isSelected ? selected.filter((item) => item !== value) : [...selected, value],
        };
      });
    },
    [currentQuestion]
  );

  const resetCurrent = useCallback(() => {
    setAnswers((prev) => {
      const key = currentQuestion.key;
      if (prev[key].length === 0) return prev;
      return { ...prev, [key]: [] };
    });
  }, [currentQuestion]);

  const resetAll = useCallback(() => {
    setAnswers(initialAnswers());
    setCurrentStep(0);
    router.replace("/questionnaire", { scroll: false });
  }, [router]);

  useEffect(() => {
    if (currentQuestion.type !== "single") return;
    if (selectedValues.length === 0) return;
    const timer = window.setTimeout(() => {
      goNext();
    }, 420);
    return () => window.clearTimeout(timer);
  }, [selectedValues, currentQuestion, goNext]);

  const progressPercent = Math.round(((currentStep + 1) / totalSteps) * 100);
  const progressPercentLabel = `${toPersianNumbers(String(progressPercent))}%`;
  const progressLabel = `${TEXT.progressPrefix} ${toPersianNumbers(String(currentStep + 1))} ${TEXT.progressOf} ${toPersianNumbers(String(totalSteps))}`;

  const limitMessage = useMemo(() => {
    if (currentQuestion.type !== "multiple" || typeof currentQuestion.maxSelections !== "number") {
      return null;
    }
    const max = currentQuestion.maxSelections;
    const remaining = Math.max(0, max - selectedValues.length);
    const base = `حداکثر ${toPersianNumbers(String(max))} انتخاب`;
    if (remaining === 0) {
      return `${base} تکمیل شد.`;
    }
    if (remaining === max) {
      return `${base} — هنوز انتخابی انجام نشده است.`;
    }
    return `${base} — می‌توانید ${toPersianNumbers(String(remaining))} گزینه دیگر برگزینید.`;
  }, [currentQuestion, selectedValues.length]);

  const summaryChips = useMemo(() => {
    const chips: string[] = [];
    if (answers.moods.length) chips.push(`${TEXT.summaryLabels.moods}: ${separatorJoin(answers.moods)}`);
    if (answers.moments.length) chips.push(`${TEXT.summaryLabels.moments}: ${separatorJoin(answers.moments)}`);
    if (answers.times.length) chips.push(`${TEXT.summaryLabels.times}: ${separatorJoin(answers.times)}`);
    if (answers.intensity.length) chips.push(`${TEXT.summaryLabels.intensity}: ${separatorJoin(answers.intensity)}`);
    if (answers.styles.length) chips.push(`${TEXT.summaryLabels.styles}: ${separatorJoin(answers.styles)}`);
    if (answers.noteLikes.length) chips.push(`${TEXT.summaryLabels.likes}: ${separatorJoin(answers.noteLikes)}`);
    if (answers.noteDislikes.length) chips.push(`${TEXT.summaryLabels.dislikes}: ${separatorJoin(answers.noteDislikes)}`);
    return chips.slice(0, SUMMARY_PREVIEW_LIMIT);
  }, [answers]);

  const canProceed = currentQuestion.optional || selectedValues.length > 0;
  const helperText = currentQuestion.optional ? TEXT.optional : TEXT.requiredHint;

  return (
    <KioskFrame>
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-16 top-12 h-48 w-48 rounded-full bg-amber-200/25 blur-[100px]" />
          <div className="absolute right-10 bottom-16 h-56 w-56 rounded-full bg-white/20 blur-[120px]" />
        </div>
        <div className="relative flex h-full w-full max-w-[1200px] flex-col gap-6 rounded-3xl glass-deep px-6 py-8 shadow-2xl animate-blur-in">
          <ProgressPanel
            title={currentQuestion.title}
            description={currentQuestion.description}
            progressLabel={progressLabel}
            progressPercent={progressPercent}
            progressPercentLabel={progressPercentLabel}
            summaryHeading={TEXT.summaryHeading}
            summaryChips={summaryChips}
            optional={Boolean(currentQuestion.optional)}
            optionalLabel={TEXT.optional}
            limitMessage={limitMessage}
            onResetCurrent={resetCurrent}
            onResetAll={resetAll}
          />

          <section className="flex flex-1 items-center justify-center animate-scale-in animate-delay-2">
            <OptionGrid
              question={currentQuestion}
              selectedValues={selectedValues}
              onToggle={toggle}
              emptyMessage={TEXT.noOptions}
            />
          </section>

          <NavigationControls
            onBack={goBack}
            onNext={goNext}
            disableBack={currentStep === 0}
            disableNext={!canProceed}
            backLabel={TEXT.back}
            nextLabel={currentStep === totalSteps - 1 ? TEXT.finish : TEXT.next}
            helperText={helperText}
            isOptional={Boolean(currentQuestion.optional)}
          />
        </div>
      </div>
    </KioskFrame>
  );
};

export default Questionnaire;
