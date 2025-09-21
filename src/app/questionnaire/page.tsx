"use client";

import { useState, useEffect } from "react";
import {
  getScentFamilies,
  getOccasions,
  getIntensities,
  formatToman,
  toPersianNumbers,
} from "@/lib/api";
import { useRouter } from "next/navigation";

interface QuestionnaireAnswers {
  scent_families: string[];
  occasions: string[];
  intensities: string[];
  price_min: number;
  price_max: number;
}

export default function Questionnaire() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({
    scent_families: [],
    occasions: [],
    intensities: [],
    price_min: 500000, // 500,000 Toman
    price_max: 10000000, // 10,000,000 Toman
  });

  // Options from Strapi
  const [scentFamilies, setScentFamilies] = useState<string[]>([]);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [intensities, setIntensities] = useState<string[]>([]);

  useEffect(() => {
    async function fetchOptions() {
      const [families, occs, ints] = await Promise.all([
        getScentFamilies(),
        getOccasions(),
        getIntensities(),
      ]);
      setScentFamilies(families);
      setOccasions(occs);
      setIntensities(ints);
    }
    fetchOptions();
  }, []);

  const questions = [
    {
      title: "کدام خانواده رایحه را ترجیح می‌دهید؟",
      subtitle: "تمام گزینه‌های مورد علاقه‌تان را انتخاب کنید",
      type: "multiple",
      options: scentFamilies || [],
      key: "scent_families" as keyof QuestionnaireAnswers,
    },
    {
      title: "این عطر را در چه مواقعی استفاده خواهید کرد؟",
      subtitle: "مناسبت‌های مورد نظر خود را انتخاب کنید",
      type: "multiple",
      options: occasions || [],
      key: "occasions" as keyof QuestionnaireAnswers,
    },
    {
      title: "شدت عطر شما چقدر باشد؟",
      subtitle: "شدت مورد علاقه‌تان را انتخاب کنید",
      type: "single",
      options: intensities || [],
      key: "intensities" as keyof QuestionnaireAnswers,
    },
    {
      title: "بودجه شما چقدر است؟",
      subtitle: "محدوده قیمت مورد نظر خود را تنظیم کنید",
      type: "price",
      key: "price_range",
    },
  ];

  const currentQuestion = questions[currentStep];

  const handleOptionToggle = (
    option: string,
    key: keyof QuestionnaireAnswers
  ) => {
    setAnswers((prev) => {
      if (currentQuestion.type === "single") {
        return { ...prev, [key]: [option] };
      } else {
        const currentValues = prev[key] as string[];
        const isSelected = currentValues.includes(option);
        return {
          ...prev,
          [key]: isSelected
            ? currentValues.filter((v) => v !== option)
            : [...currentValues, option],
        };
      }
    });
  };

  const handlePriceChange = (min: number, max: number) => {
    setAnswers((prev) => ({ ...prev, price_min: min, price_max: max }));
  };

  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Go to recommendations with answers
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
    const key = currentQuestion.key as keyof QuestionnaireAnswers;
    if (currentQuestion.type === "price") return true;
    const values = answers[key] as string[];
    return values && values.length > 0;
  };

  const progressPercentage = Math.round(
    ((currentStep + 1) / questions.length) * 100
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>{toPersianNumbers(progressPercentage.toString())}%</span>
            <span>
              سوال {toPersianNumbers((currentStep + 1).toString())} از{" "}
              {toPersianNumbers(questions.length.toString())}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {currentQuestion.title}
          </h2>
          <p className="text-gray-600">{currentQuestion.subtitle}</p>
        </div>

        {/* Options */}
        <div className="mb-8">
          {currentQuestion.type === "price" ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">
                  {formatToman(answers.price_max)}
                </span>
                <span className="text-lg font-semibold">
                  {formatToman(answers.price_min)}
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    حداقل قیمت
                  </label>
                  <input
                    type="range"
                    min="500000"
                    max="20000000"
                    step="100000"
                    value={answers.price_min}
                    onChange={(e) =>
                      handlePriceChange(
                        parseInt(e.target.value),
                        answers.price_max
                      )
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    حداکثر قیمت
                  </label>
                  <input
                    type="range"
                    min="500000"
                    max="20000000"
                    step="100000"
                    value={answers.price_max}
                    onChange={(e) =>
                      handlePriceChange(
                        answers.price_min,
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentQuestion.options?.map((option) => {
                const key = currentQuestion.key as keyof QuestionnaireAnswers;
                const values = answers[key] as string[];
                const isSelected = values.includes(option);

                return (
                  <button
                    key={option}
                    onClick={() => handleOptionToggle(option, key)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                      isSelected
                        ? "border-purple-600 bg-purple-50 text-purple-800"
                        : "border-gray-200 hover:border-purple-300 hover:bg-purple-25"
                    }`}
                  >
                    <span className="font-medium text-lg">{option}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={nextStep}
            disabled={!canProceed()}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              canProceed()
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {currentStep === questions.length - 1 ? "دریافت پیشنهادات" : "بعدی"}
          </button>

          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              currentStep === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            قبلی
          </button>
        </div>
      </div>
    </div>
  );
}
