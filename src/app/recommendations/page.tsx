"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getPerfumes, formatToman, type Perfume } from "@/lib/api";
import Link from "next/link";

interface QuestionnaireAnswers {
  scent_families: string[];
  occasions: string[];
  intensities: string[];
  price_min: number;
  price_max: number;
}

function RecommendationsContent() {
  const searchParams = useSearchParams();
  const [recommendations, setRecommendations] = useState<
    (Perfume & { score: number })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);

  useEffect(() => {
    async function generateRecommendations() {
      try {
        const answersParam = searchParams.get("answers");
        if (!answersParam) {
          setLoading(false);
          return;
        }

        const userAnswers: QuestionnaireAnswers = JSON.parse(answersParam);
        setAnswers(userAnswers);

        const allPerfumes = await getPerfumes();

        // Define scored perfume type
        type ScoredPerfume = Perfume & { score: number };

        // Simple recommendation algorithm
        const scored: ScoredPerfume[] = allPerfumes.map((perfume) => {
          let score = 0;

          // Scent family match (highest weight)
          const scentMatch = userAnswers.scent_families.some((family) =>
            perfume.scent_families.includes(family)
          );
          if (scentMatch) score += 10;

          // Occasion match
          const occasionMatch = userAnswers.occasions.some((occasion) =>
            perfume.occasions.includes(occasion)
          );
          if (occasionMatch) score += 8;

          // Intensity match
          const intensityMatch = userAnswers.intensities.some((intensity) =>
            perfume.intensities.includes(intensity)
          );
          if (intensityMatch) score += 6;

          // Price range match
          if (
            perfume.price >= userAnswers.price_min &&
            perfume.price <= userAnswers.price_max
          ) {
            score += 5;
          }

          // Bonus for multiple matches
          if (score >= 20) score += 5;

          return { ...perfume, score };
        });

        // Sort by score and take top 5
        const topRecommendations: ScoredPerfume[] = scored
          .filter((p) => p.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        setRecommendations(topRecommendations);
      } catch (error) {
        console.error("Error generating recommendations:", error);
      } finally {
        setLoading(false);
      }
    }

    generateRecommendations();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-2xl font-semibold text-gray-700">
            در حال یافتن بهترین گزینه‌ها...
          </div>
        </div>
      </div>
    );
  }

  if (!answers) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            اطلاعات پرسشنامه یافت نشد
          </h2>
          <Link
            href="/questionnaire"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            شروع پرسشنامه
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 to-purple-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            پیشنهادات ویژه شما
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            بر اساس نظرات شما، ۵ عطر برتر را برای شما انتخاب کرده‌ایم
          </p>

          {/* User preferences summary */}
          <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              ترجیحات شما:
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-purple-600">
                  خانواده رایحه:
                </span>
                <p>{answers.scent_families.join("، ") || "انتخاب نشده"}</p>
              </div>
              <div>
                <span className="font-medium text-purple-600">مناسبت:</span>
                <p>{answers.occasions.join("، ") || "انتخاب نشده"}</p>
              </div>
              <div>
                <span className="font-medium text-purple-600">شدت:</span>
                <p>{answers.intensities.join("، ") || "انتخاب نشده"}</p>
              </div>
              <div>
                <span className="font-medium text-purple-600">بودجه:</span>
                <p>
                  {formatToman(answers.price_min)} -{" "}
                  {formatToman(answers.price_max)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendations.map((perfume, index) => (
              <div
                key={perfume.id}
                className="bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300"
              >
                {/* Rank badge */}
                <div className="relative">
                  <div className="absolute top-4 right-4 bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg z-10">
                    {index + 1}
                  </div>
                  {perfume.image && (
                    <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <span className="text-gray-500">تصویر محصول</span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {perfume.name}
                  </h3>
                  <p className="text-lg text-gray-600 mb-1">{perfume.brand}</p>
                  <p className="text-2xl font-bold text-purple-600 mb-4">
                    {formatToman(perfume.price)}
                  </p>

                  {perfume.description && (
                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {perfume.description}
                    </p>
                  )}

                  {/* Attributes */}
                  <div className="space-y-2">
                    {perfume.scent_families.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          رایحه:{" "}
                        </span>
                        <div className="inline-flex flex-wrap gap-1">
                          {perfume.scent_families.map((family, i) => (
                            <span
                              key={i}
                              className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded"
                            >
                              {family}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {perfume.occasions.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          مناسب برای:{" "}
                        </span>
                        <div className="inline-flex flex-wrap gap-1">
                          {perfume.occasions.map((occasion, i) => (
                            <span
                              key={i}
                              className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                            >
                              {occasion}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Match score indicator */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">میزان تطبیق</span>
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 ml-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(perfume.score * 3, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-purple-600">
                          {Math.round(Math.min(perfume.score * 3, 100))}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center bg-white rounded-lg p-12 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              متأسفانه عطری یافت نشد
            </h2>
            <p className="text-gray-600 mb-6">
              عطری متناسب با معیارهای دقیق شما پیدا نکردیم. لطفاً ترجیحات خود را
              تغییر دهید.
            </p>
            <Link
              href="/questionnaire"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg"
            >
              تغییر ترجیحات
            </Link>
          </div>
        )}

        {/* Action buttons */}
        <div className="text-center mt-12 space-x-4 space-x-reverse">
          <Link
            href="/questionnaire"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg ml-4"
          >
            ترجیحات متفاوت
          </Link>
          <Link
            href="/"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            شروع مجدد
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-pink-100 to-purple-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      }
    >
      <RecommendationsContent />
    </Suspense>
  );
}
