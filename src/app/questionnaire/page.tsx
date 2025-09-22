"use client";

import { useState, useEffect } from "react";
import {
  getScentFamilies,
  getOccasions,
  getIntensities,
  getGenders,
  getBrands,
  getNoteOptions,
  toPersianNumbers,
} from "@/lib/api";
import { useRouter } from "next/navigation";

interface QuestionnaireAnswers {
  families: string[];
  seasons: string[];
  characters: string[];
  genders: string[];
  preferredBrands: string[];
  preferredNotes: string[];
  avoidNotes: string[];
}

type QuestionType = "multiple" | "single";

interface QuestionDefinition {
  title: string;
  subtitle: string;
  type: QuestionType;
  options: string[];
  key: keyof QuestionnaireAnswers;
  optional?: boolean;
  maxSelections?: number;
}

const toOptions = (values: string[]): string[] =>
  values.sort((a, b) => a.localeCompare(b, "fa"));

export default function Questionnaire() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({
    families: [],
    seasons: [],
    characters: [],
    genders: [],
    preferredBrands: [],
    preferredNotes: [],
    avoidNotes: [],
  });

  const [families, setFamilies] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [characters, setCharacters] = useState<string[]>([]);
  const [genders, setGendersState] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [notes, setNotes] = useState<string[]>([]);

  useEffect(() => {
    async function fetchOptions() {
      const [familyValues, seasonValues, characterValues, genderValues, brandValues, noteValues] =
        await Promise.all([
          getScentFamilies(),
          getOccasions(),
          getIntensities(),
          getGenders(),
          getBrands(),
          getNoteOptions(),
        ]);

      setFamilies(toOptions(familyValues));
      setSeasons(toOptions(seasonValues));
      setCharacters(toOptions(characterValues));
      setGendersState(toOptions(genderValues));
      setBrands(toOptions(brandValues));
      setNotes(noteValues.sort((a, b) => a.localeCompare(b, "en")));
    }

    fetchOptions();
  }, []);

  const questions: QuestionDefinition[] = [
    {
      title: "کدام خانواده‌های بویایی را ترجیح می‌دهید؟",
      subtitle: "می‌توانید چند گزینه را انتخاب کنید.",
      type: "multiple",
      options: families,
      key: "families",
    },
    {
      title: "عطر برای چه فصلی مناسب باشد؟",
      subtitle: "مواردی که ترجیح می‌دهید انتخاب کنید.",
      type: "multiple",
      options: seasons,
      key: "seasons",
    },
    {
      title: "چه حس و حالی را بیشتر دوست دارید؟",
      subtitle: "تنها یک گزینه را انتخاب کنید.",
      type: "single",
      options: characters,
      key: "characters",
    },
    {
      title: "این عطر بیشتر برای چه کسی است؟",
      subtitle: "جنسیت هدف را مشخص کنید.",
      type: "single",
      options: genders,
      key: "genders",
    },
    {
      title: "برندهای محبوب شما کدام‌اند؟",
      subtitle: "حداکثر سه برند را انتخاب کنید (اختیاری).",
      type: "multiple",
      options: brands,
      key: "preferredBrands",
      optional: true,
      maxSelections: 3,
    },
    {
      title: "به دنبال چه نت‌هایی هستید؟",
      subtitle: "حداکثر شش نت مورد علاقه خود را انتخاب کنید (اختیاری).",
      type: "multiple",
      options: notes,
      key: "preferredNotes",
      optional: true,
      maxSelections: 6,
    },
    {
      title: "از چه نت‌هایی باید دوری کنیم؟",
      subtitle: "نت‌هایی که نمی‌پسندید را مشخص کنید (اختیاری).",
      type: "multiple",
      options: notes,
      key: "avoidNotes",
      optional: true,
      maxSelections: 6,
    },
  ];

  const currentQuestion = questions[currentStep];

  const handleOptionToggle = (question: QuestionDefinition, option: string) => {
    setAnswers((prev) => {
      const key = question.key;
      const currentValues = prev[key];
      const isSelected = currentValues.includes(option);
      const atLimit =
        !isSelected &&
        typeof question.maxSelections === "number" &&
        currentValues.length >= question.maxSelections;

      if (question.type === "single") {
        return { ...prev, [key]: isSelected ? [] : [option] };
      }

      if (atLimit) {
        return prev;
      }

      return {
        ...prev,
        [key]: isSelected
          ? currentValues.filter((value) => value !== option)
          : [...currentValues, option],
      };
    });
  };

  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const queryParams = new URLSearchParams({
        answers: JSON.stringify(answers),
      });
      router.push(`/recommendations?${queryParams}`);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    const question = currentQuestion;
    if (question.optional) {
      return true;
    }
    const values = answers[question.key];
    return values.length > 0;
  };

  const progressPercentage = Math.round(
    ((currentStep + 1) / questions.length) * 100
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="surface-card w-full max-w-3xl space-y-8">
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-subtle">
            <span>{toPersianNumbers(progressPercentage.toString())}%</span>
            <span>
              پرسش {toPersianNumbers((currentStep + 1).toString())} از{" "}
              {toPersianNumbers(questions.length.toString())}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-soft">
            <div
              className="h-2 rounded-full bg-[var(--color-accent)] transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="space-y-2 text-center sm:text-right">
          <h2 className="text-3xl font-semibold text-[var(--color-foreground)]">
            {currentQuestion.title}
          </h2>
          <p className="text-muted">{currentQuestion.subtitle}</p>
        </div>

        {/* Options */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {currentQuestion.options?.map((option) => {
              const key = currentQuestion.key;
              const values = answers[key];
              const isSelected = values.includes(option);
              const disabled =
                !isSelected &&
                typeof currentQuestion.maxSelections === "number" &&
                values.length >= currentQuestion.maxSelections;

              return (
                <button
                  key={option}
                  onClick={() => handleOptionToggle(currentQuestion, option)}
                  disabled={disabled}
                  className={`rounded-xl border-2 p-4 text-center font-medium transition-all duration-200 ${
                    isSelected
                      ? "border-[var(--color-accent)] bg-[var(--accent-soft)] text-[var(--color-accent)]"
                      : "border-[var(--color-border)] bg-background text-[var(--color-foreground)] hover:border-[var(--color-accent)] hover:bg-[var(--accent-soft)]"
                  } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <span className="text-lg">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            onClick={nextStep}
            disabled={!canProceed()}
            className="btn w-full sm:w-auto disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {currentStep === questions.length - 1 ? "مشاهده پیشنهادها" : "بعدی"}
          </button>

          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="btn-ghost w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
          >
            قبلی
          </button>
        </div>
      </div>
    </div>
  );
}
