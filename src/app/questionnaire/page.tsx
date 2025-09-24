"use client";

import { useMemo, useState } from "react";
import { toPersianNumbers } from "@/lib/api";
import { useRouter } from "next/navigation";
import KioskFrame from "@/components/KioskFrame";
import {
  Choice,
  INTENSITY_CHOICES,
  MOMENT_CHOICES,
  MOOD_CHOICES,
  NOTE_CHOICES,
  STYLE_CHOICES,
  TIME_CHOICES,
} from "@/lib/kiosk-options";

interface QuestionnaireAnswers {
  moods: string[];
  moments: string[];
  times: string[];
  intensity: string[];
  styles: string[];
  noteLikes: string[];
  noteDislikes: string[];
}

type QuestionType = "multiple" | "single";

interface QuestionDefinition {
  title: string;
  description?: string;
  type: QuestionType;
  options: Choice[];
  key: keyof QuestionnaireAnswers;
  optional?: boolean;
  maxSelections?: number;
}

const BTN_BASE =
  "rounded-3xl border-2 px-4 py-5 text-center text-lg font-semibold transition-transform duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] tap-highlight touch-target touch-feedback";

const initialAnswers = (): QuestionnaireAnswers => ({
  moods: [],
  moments: [],
  times: [],
  intensity: [],
  styles: [],
  noteLikes: [],
  noteDislikes: [],
});

export default function Questionnaire() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(initialAnswers);

  const questions: QuestionDefinition[] = useMemo(
    () => [
      {
        title: "حال‌وهواهای مورد علاقه شما چیست؟",
        description: "حداکثر دو مورد را انتخاب کنید.",
        type: "multiple",
        options: MOOD_CHOICES,
        key: "moods",
        maxSelections: 2,
      },
      {
        title: "این عطر را بیشتر برای چه موقعیت‌هایی می‌خواهید؟",
        description: "حداکثر سه مورد را انتخاب کنید.",
        type: "multiple",
        options: MOMENT_CHOICES,
        key: "moments",
        maxSelections: 3,
      },
      {
        title: "بیشتر برای چه زمانی از روز؟",
        type: "single",
        options: TIME_CHOICES,
        key: "times",
      },
      {
        title: "شدت پخش بو را ترجیح می‌دهید؟",
        description: "از ملایم تا قوی.",
        type: "single",
        options: INTENSITY_CHOICES,
        key: "intensity",
      },
      {
        title: "سبک عطر مورد علاقه شما چیست؟",
        type: "single",
        options: STYLE_CHOICES,
        key: "styles",
      },
      {
        title: "به کدام دسته از نُت‌ها علاقه دارید؟",
        description: "اختیاری؛ تا سه مورد.",
        type: "multiple",
        options: NOTE_CHOICES,
        key: "noteLikes",
        optional: true,
        maxSelections: 3,
      },
      {
        title: "از کدام دسته از نُت‌ها خوشتان نمی‌آید؟",
        description: "اختیاری؛ تا سه مورد.",
        type: "multiple",
        options: NOTE_CHOICES,
        key: "noteDislikes",
        optional: true,
        maxSelections: 3,
      },
    ],
    []
  );

  const currentQuestion = questions[currentStep];

  const toggle = (value: string) => {
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
        [key]: isSelected
          ? selected.filter((v) => v !== value)
          : [...selected, value],
      };
    });
  };

  const next = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      const qs = new URLSearchParams({ answers: JSON.stringify(answers) });
      router.push(`/recommendations?${qs}`);
    }
  };

  const back = () => currentStep > 0 && setCurrentStep((s) => s - 1);

  const canProceed = () =>
    currentQuestion.optional || answers[currentQuestion.key].length > 0;

  const progress = Math.round(((currentStep + 1) / questions.length) * 100);

  return (
    <KioskFrame>
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="relative flex h-full w-full max-w-[1200px] flex-col gap-6 rounded-3xl bg-white/8 backdrop-blur-[48px] border border-white/15 px-6 py-6 shadow-2xl animate-blur-in">
          <header className="flex items-center justify-between animate-slide-in-right">
            <div className="space-y-2 text-right">
              <p className="m-0 text-xs text-muted" aria-live="polite">
                سوال {toPersianNumbers(String(currentStep + 1))} از {toPersianNumbers(String(questions.length))}
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
                    className={`${BTN_BASE} text-base sm:text-lg animate-fade-in-up ${delayClass} ${
                      isSelected
                        ? "border-[var(--color-accent)] bg-[var(--accent-soft)] text-[var(--color-accent)] "
                        : "border-[var(--color-border)] bg-background text-[var(--color-foreground)]"
                    } ${disabled ? "opacity-50" : ""}`}
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
            <span className="text-xs text-muted">
              {currentQuestion.optional ? "اختیاری" : "برای ادامه لطفاً یک گزینه را انتخاب کنید."}
            </span>
            <button onClick={next} disabled={!canProceed()} className="btn w-32 tap-highlight touch-target touch-feedback">
              {currentStep === questions.length - 1 ? "مشاهده پیشنهادها" : "بعدی"}
            </button>
          </footer>
        </div>
      </div>
    </KioskFrame>
  );
}

