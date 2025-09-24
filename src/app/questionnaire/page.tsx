"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toPersianNumbers } from "@/lib/api";
import { useRouter } from "next/navigation";
import TouchRipple from "@/components/TouchRipple";
import KioskFrame from "@/components/KioskFrame";
import {
  Choice,
  INTENSITY_CHOICES,
  MOMENT_CHOICES,
  MOOD_CHOICES,
  NOTE_CHOICES,
  STYLE_CHOICES,
  TIME_CHOICES,
  LABEL_LOOKUP,
} from "@/lib/kiosk-options";

type QuestionType = "multiple" | "single";

interface QuestionnaireAnswers {
  moods: string[];
  moments: string[];
  times: string[];
  intensity: string[];
  styles: string[];
  noteLikes: string[];
  noteDislikes: string[];
}

interface QuestionDefinition {
  title: string;
  description?: string;
  type: QuestionType;
  options: Choice[];
  key: keyof QuestionnaireAnswers;
  optional?: boolean;
  maxSelections?: number;
}

const TEXT = {
  progressPrefix: "سوال",
  progressOf: "از",
  optional: "اختیاری",
  requiredHint: "برای ادامه لطفاً یک گزینه را انتخاب کنید.",
  back: "بازگشت",
  next: "بعدی",
  finish: "مشاهده پیشنهادات",
  noOptions: "موردی در دسترس نیست.",
  summaryHeading: "گزینه‌های انتخابی",
  separator: "، ",
  questions: {
    moods: {
      title: "حال‌وهواهای مورد علاقه شما چیست؟",
      description: "حداکثر دو مورد را انتخاب کنید.",
    },
    moments: {
      title: "این عطر را بیشتر برای چه موقعیت‌هایی می‌خواهید؟",
      description: "حداکثر سه مورد را انتخاب کنید.",
    },
    times: {
      title: "بیشتر برای چه زمانی از روز؟",
    },
    intensity: {
      title: "شدت پخش بو را ترجیح می‌دهید؟",
      description: "از ملایم تا قوی.",
    },
    styles: {
      title: "سبک عطر مورد علاقه شما چیست؟",
    },
    likes: {
      title: "به کدام دسته از نُت‌ها علاقه دارید؟",
      description: "اختیاری؛ تا سه مورد.",
    },
    dislikes: {
      title: "از کدام دسته از نُت‌ها خوشتان نمی‌آید؟",
      description: "اختیاری؛ تا سه مورد.",
    },
  },
  summaryLabels: {
    moods: "حال‌وهوا",
    moments: "موقعیت",
    times: "زمان",
    intensity: "شدت",
    styles: "سبک",
    likes: "نُت‌های محبوب",
    dislikes: "نُت‌های نامطلوب",
  },
};

const QUESTION_CONFIG: QuestionDefinition[] = [
  {
    key: "moods",
    type: "multiple",
    options: MOOD_CHOICES,
    title: TEXT.questions.moods.title,
    description: TEXT.questions.moods.description,
    maxSelections: 2,
  },
  {
    key: "moments",
    type: "multiple",
    options: MOMENT_CHOICES,
    title: TEXT.questions.moments.title,
    description: TEXT.questions.moments.description,
    maxSelections: 3,
  },
  {
    key: "times",
    type: "single",
    options: TIME_CHOICES,
    title: TEXT.questions.times.title,
  },
  {
    key: "intensity",
    type: "single",
    options: INTENSITY_CHOICES,
    title: TEXT.questions.intensity.title,
    description: TEXT.questions.intensity.description,
  },
  {
    key: "styles",
    type: "single",
    options: STYLE_CHOICES,
    title: TEXT.questions.styles.title,
  },
  {
    key: "noteLikes",
    type: "multiple",
    options: NOTE_CHOICES,
    title: TEXT.questions.likes.title,
    description: TEXT.questions.likes.description,
    optional: true,
    maxSelections: 3,
  },
  {
    key: "noteDislikes",
    type: "multiple",
    options: NOTE_CHOICES,
    title: TEXT.questions.dislikes.title,
    description: TEXT.questions.dislikes.description,
    optional: true,
    maxSelections: 3,
  },
];

const BTN_BASE =
  "group relative overflow-hidden rounded-3xl border-2 px-4 py-5 text-center text-lg font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-transparent tap-highlight touch-target";

const initialAnswers = (): QuestionnaireAnswers => ({
  moods: [],
  moments: [],
  times: [],
  intensity: [],
  styles: [],
  noteLikes: [],
  noteDislikes: [],
});

const separatorJoin = (values: string[]) =>
  values
    .map((value) => LABEL_LOOKUP[value] ?? value)
    .filter((value) => value.trim().length > 0)
    .join(TEXT.separator);

interface OptionButtonProps {
  option: Choice;
  isSelected: boolean;
  disabled: boolean;
  delayClass: string;
  onClick: () => void;
}

const OptionButton: React.FC<OptionButtonProps> = ({ option, isSelected, disabled, delayClass, onClick }) => {
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handlePointerDown = React.useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const node = buttonRef.current;
    const ripple = (TouchRipple as unknown as { emit?: (x: number, y: number) => void }).emit;
    if (!node || !ripple) return;
    const rect = node.getBoundingClientRect();
    ripple(event.clientX - rect.left, event.clientY - rect.top);
  }, []);

  const visualState = isSelected
    ? "border-[var(--color-accent)] bg-[var(--accent-soft)] text-[var(--color-accent)] shadow-strong"
    : "border-white/25 bg-white/6 text-[var(--color-foreground)] hover:border-white/40 hover:bg-white/15";

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      disabled={disabled}
      aria-pressed={isSelected}
      className={[BTN_BASE, delayClass, visualState, disabled ? "opacity-55 cursor-not-allowed" : "active:scale-95"].join(" ")}
    >
      <TouchRipple />
      <span className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-white/12 to-transparent opacity-0 transition-opacity duration-200 group-aria-pressed:opacity-100 group-focus-visible:opacity-100" />
      <span className="relative flex flex-col items-center gap-1">
        {option.icon && <span className="text-2xl sm:text-[28px]">{option.icon}</span>}
        <span className="text-sm sm:text-base font-medium leading-6">{option.label}</span>
      </span>
    </button>
  );
};

export default function Questionnaire() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(initialAnswers);

  const questions = QUESTION_CONFIG;
  const totalSteps = questions.length;
  const currentQuestion = questions[currentStep];

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((step) => Math.min(step + 1, totalSteps - 1));
    } else {
      const qs = new URLSearchParams({ answers: JSON.stringify(answers) });
      router.push(`/recommendations?${qs}`);
    }
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

  useEffect(() => {
    if (currentQuestion.type !== "single") return;
    if (answers[currentQuestion.key].length === 0) return;
    const timer = window.setTimeout(() => {
      goNext();
    }, 420);
    return () => window.clearTimeout(timer);
  }, [answers, currentQuestion, goNext]);

  const progressPercent = Math.round(((currentStep + 1) / totalSteps) * 100);
  const progressLabel = `${TEXT.progressPrefix} ${toPersianNumbers(String(currentStep + 1))} ${TEXT.progressOf} ${toPersianNumbers(String(totalSteps))}`;
  const canProceed = currentQuestion.optional || answers[currentQuestion.key].length > 0;

  const summaryChips = useMemo(() => {
    const chips: string[] = [];
    if (answers.moods.length) chips.push(`${TEXT.summaryLabels.moods}: ${separatorJoin(answers.moods)}`);
    if (answers.moments.length) chips.push(`${TEXT.summaryLabels.moments}: ${separatorJoin(answers.moments)}`);
    if (answers.times.length) chips.push(`${TEXT.summaryLabels.times}: ${separatorJoin(answers.times)}`);
    if (answers.intensity.length) chips.push(`${TEXT.summaryLabels.intensity}: ${separatorJoin(answers.intensity)}`);
    if (answers.styles.length) chips.push(`${TEXT.summaryLabels.styles}: ${separatorJoin(answers.styles)}`);
    if (answers.noteLikes.length) chips.push(`${TEXT.summaryLabels.likes}: ${separatorJoin(answers.noteLikes)}`);
    if (answers.noteDislikes.length) chips.push(`${TEXT.summaryLabels.dislikes}: ${separatorJoin(answers.noteDislikes)}`);
    return chips.slice(0, 4);
  }, [answers]);

  return (
    <KioskFrame>
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-16 top-12 h-48 w-48 rounded-full bg-amber-200/25 blur-[100px]" />
          <div className="absolute right-10 bottom-16 h-56 w-56 rounded-full bg-white/20 blur-[120px]" />
        </div>
        <div className="relative flex h-full w-full max-w-[1200px] flex-col gap-6 rounded-3xl glass-deep px-6 py-8 shadow-2xl animate-blur-in">
          <header className="flex flex-col gap-5 animate-slide-in-right">
            <div className="flex items-center justify-between">
              <div className="space-y-2 text-right">
                <p className="m-0 text-xs font-medium text-muted" aria-live="polite">
                  {progressLabel}
                </p>
                <h1 className="text-3xl font-semibold text-[var(--color-foreground)]">
                  {currentQuestion.title}
                </h1>
                {currentQuestion.description && (
                  <p className="m-0 text-sm text-muted">{currentQuestion.description}</p>
                )}
              </div>
              <div className="w-44 sm:w-56">
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/15">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 shadow-lg transition-[width] duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="mt-2 block text-right text-xs font-medium text-[var(--color-accent)]">
                  {toPersianNumbers(String(progressPercent))}%
                </span>
              </div>
            </div>
            {summaryChips.length > 0 && (
              <div className="flex flex-wrap justify-end gap-2 text-xs text-muted">
                <span className="rounded-full border border-white/25 px-3 py-1 font-semibold text-[var(--color-accent)]">
                  {TEXT.summaryHeading}
                </span>
                {summaryChips.map((chip, index) => (
                  <span key={index} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs">
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </header>

          <section className="flex flex-1 items-center justify-center animate-scale-in animate-delay-2">
            <div className="grid w-full max-w-[900px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
              {currentQuestion.options.map((option, idx) => {
                const values = answers[currentQuestion.key];
                const isSelected = values.includes(option.value);
                const disabled =
                  !isSelected &&
                  typeof currentQuestion.maxSelections === "number" &&
                  values.length >= currentQuestion.maxSelections;
                const delayClass = idx % 3 === 1 ? "animate-delay-1" : idx % 3 === 2 ? "animate-delay-2" : "animate-delay-0";
                return (
                  <OptionButton
                    key={option.value}
                    option={option}
                    isSelected={isSelected}
                    disabled={disabled}
                    delayClass={delayClass}
                    onClick={() => toggle(option.value)}
                  />
                );
              })}
              {currentQuestion.options.length === 0 && (
                <div className="col-span-full flex h-full items-center justify-center rounded-3xl border border-white/15 bg-white/10 text-sm text-muted">
                  {TEXT.noOptions}
                </div>
              )}
            </div>
          </section>

          <footer className="flex items-center justify-between gap-3 animate-slide-in-left animate-delay-3">
            <button
              onClick={goBack}
              disabled={currentStep === 0}
              className="btn-ghost w-32 tap-highlight touch-target touch-feedback"
            >
              {TEXT.back}
            </button>
            <span className="text-xs text-muted">
              {currentQuestion.optional ? TEXT.optional : TEXT.requiredHint}
            </span>
            <button
              onClick={goNext}
              disabled={!canProceed}
              className="btn w-32 tap-highlight touch-target touch-feedback"
            >
              {currentStep === totalSteps - 1 ? TEXT.finish : TEXT.next}
            </button>
          </footer>
        </div>
      </div>
    </KioskFrame>
  );
}
