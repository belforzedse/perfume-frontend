"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getPerfumes, type Perfume } from "@/lib/api";
import Link from "next/link";

interface QuestionnaireAnswers {
  families: string[];
  seasons: string[];
  characters: string[];
  genders: string[];
  preferredBrands: string[];
  preferredNotes: string[];
  avoidNotes: string[];
}

type RankedPerfume = Perfume & {
  score: number;
  maxScore: number;
  matchPercentage: number;
  reasons: string[];
  noteMatches: string[];
};

const WEIGHTS = {
  family: 20,
  season: 14,
  character: 14,
  gender: 6,
  brand: 8,
  notes: 24,
  synergy: 6,
} as const;

const MAJOR_COMPONENTS = new Set(["family", "season", "character", "gender", "brand"]);

const ensureArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return [value.trim()];
  }
  return [];
};

const normalizeAnswers = (raw: unknown): QuestionnaireAnswers => {
  if (!raw || typeof raw !== "object") {
    return {
      families: [],
      seasons: [],
      characters: [],
      genders: [],
      preferredBrands: [],
      preferredNotes: [],
      avoidNotes: [],
    };
  }

  const data = raw as Partial<Record<keyof QuestionnaireAnswers, unknown>>;

  return {
    families: ensureArray(data.families),
    seasons: ensureArray(data.seasons),
    characters: ensureArray(data.characters),
    genders: ensureArray(data.genders),
    preferredBrands: ensureArray(data.preferredBrands),
    preferredNotes: ensureArray(data.preferredNotes),
    avoidNotes: ensureArray(data.avoidNotes),
  };
};

const buildPerfumeTitle = (perfume: Perfume): string => {
  if (perfume.nameFa && perfume.nameFa.trim().length > 0) {
    return perfume.nameFa;
  }
  return perfume.nameEn;
};

const buildMetaLine = (perfume: Perfume): string => {
  const parts = [perfume.brand, perfume.collection].filter(
    (value): value is string => !!value && value.trim().length > 0
  );
  return parts.join(" - ");
};

const hasAnyNotes = (perfume: Perfume): boolean => {
  const { top, middle, base } = perfume.notes;
  return top.length > 0 || middle.length > 0 || base.length > 0;
};

const noteGroups: Array<{ key: keyof Perfume["notes"]; label: string }> = [
  { key: "top", label: "نت‌های آغازین" },
  { key: "middle", label: "نت‌های میانی" },
  { key: "base", label: "نت‌های پایانی" },
];

const normaliseNote = (note: string): string => note.trim().toLowerCase();

const computeScore = (
  perfume: Perfume,
  answers: QuestionnaireAnswers
): RankedPerfume | null => {
  const components: Array<{
    id: string;
    weight: number;
    achieved: number;
    reason?: string;
    reason?: string;
  }> = [];

  const reasons: string[] = [];

  const perfumeNotes = new Set(perfume.allNotes.map(normaliseNote));

  const addComponent = (
    id: keyof typeof WEIGHTS | "notes",
    weight: number,
    achieved: number,
    reason?: string
  ) => {
    components.push({ id, weight, achieved, reason });
    if (reason && achieved > 0) {
      reasons.push(reason);
    }
  };

  if (answers.families.length && perfume.family) {
    const matched = answers.families.includes(perfume.family);
    addComponent(
      "family",
      WEIGHTS.family,
      matched ? 1 : 0,
      matched ? `در خانواده ${perfume.family}` : undefined
    );
  }

  if (answers.seasons.length && perfume.season) {
    const matched = answers.seasons.includes(perfume.season);
    addComponent(
      "season",
      WEIGHTS.season,
      matched ? 1 : 0,
      matched ? `مناسب فصل ${perfume.season}` : undefined
    );
  }

  if (answers.characters.length && perfume.character) {
    const matched = answers.characters.includes(perfume.character);
    addComponent(
      "character",
      WEIGHTS.character,
      matched ? 1 : 0,
      matched ? `با حال‌وهوای ${perfume.character}` : undefined
    );
  }

  if (answers.genders.length && perfume.gender) {
    const matched = answers.genders.includes(perfume.gender);
    addComponent(
      "gender",
      WEIGHTS.gender,
      matched ? 1 : 0,
      matched ? `برای ${perfume.gender}` : undefined
    );
  }

  if (answers.preferredBrands.length && perfume.brand) {
    const matched = answers.preferredBrands.includes(perfume.brand);
    addComponent(
      "brand",
      WEIGHTS.brand,
      matched ? 1 : 0,
      matched ? `برند محبوب ${perfume.brand}` : undefined
    );
  }

  let noteMatches: string[] = [];
  if (answers.preferredNotes.length) {
    noteMatches = answers.preferredNotes.filter((note) =>
      perfumeNotes.has(normaliseNote(note))
    );
    const ratio =
      answers.preferredNotes.length > 0
        ? Math.min(noteMatches.length / answers.preferredNotes.length, 1)
        : 0;
    addComponent(
      "notes",
      WEIGHTS.notes,
      ratio,
      noteMatches.length > 0
        ? `نت‌های دلخواه: ${noteMatches.join("، ")}`
        : undefined
    );
  }

  if (answers.avoidNotes.length) {
    const conflicts = answers.avoidNotes.filter((note) =>
      perfumeNotes.has(normaliseNote(note))
    );
    if (conflicts.length > 0) {
      return null;
    }
  }

  const majorComponents = components.filter((component) =>
    MAJOR_COMPONENTS.has(component.id as keyof typeof WEIGHTS)
  );
  const majorMatches = majorComponents.filter((component) => component.achieved >= 1)
    .length;

  if (majorComponents.length >= 3) {
    addComponent(
      "synergy",
      WEIGHTS.synergy,
      majorMatches >= 3 ? 1 : 0,
      majorMatches >= 3 ? "چند معیار کلیدی با هم تطابق دارند" : undefined
    );
  }

  const maxScore = components.reduce((total, component) => total + component.weight, 0);
  if (maxScore === 0) {
    return {
      ...perfume,
      score: 0,
      maxScore: 0,
      matchPercentage: 0,
      reasons,
      noteMatches,
    };
  }

  const score = components.reduce(
    (total, component) => total + component.weight * component.achieved,
    0
  );

  const matchPercentage = Math.round((score / maxScore) * 100);

  return {
    ...perfume,
    score,
    maxScore,
    matchPercentage,
    reasons,
    noteMatches,
  };
};

function RecommendationsContent() {
  const searchParams = useSearchParams();
  const [recommendations, setRecommendations] = useState<RankedPerfume[]>([]);
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

        const parsed = JSON.parse(answersParam) as unknown;
        const userAnswers = normalizeAnswers(parsed);
        setAnswers(userAnswers);

        const allPerfumes = await getPerfumes();

        const scored = allPerfumes
          .map((perfume) => computeScore(perfume, userAnswers))
          .filter((item): item is RankedPerfume => item !== null)
          .map((item) => ({
            ...item,
            matchPercentage: Math.min(100, Math.max(0, item.matchPercentage)),
          }));

        const topRecommendations = scored
          .filter((perfume) => perfume.score > 0)
          .sort((a, b) => b.matchPercentage - a.matchPercentage || b.score - a.score)
          .slice(0, 6);

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
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="surface-card w-full max-w-md text-center">
          <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-2 border-dashed border-[var(--color-accent)]" />
          <div className="text-lg font-semibold text-muted">
            در حال آماده‌سازی پیشنهادها...
          </div>
        </div>
      </div>
    );
  }

  if (!answers) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="surface-card w-full max-w-md text-center space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
            ابتدا پرسشنامه را کامل کنید
          </h2>
          <p className="text-muted text-sm">
            برای دریافت پیشنهادها لازم است پرسشنامه را تکمیل کنید.
          </p>
          <Link href="/questionnaire" className="btn tap-highlight">
            شروع پرسشنامه
          </Link>
        </div>
      </div>
    );
  }

  const summaryFields: Array<{
    key: keyof QuestionnaireAnswers;
    label: string;
  }> = [
    { key: "families", label: "خانواده‌های انتخابی" },
    { key: "seasons", label: "فصل‌های دلخواه" },
    { key: "characters", label: "حس و حال مورد نظر" },
    { key: "genders", label: "جنسیت هدف" },
    { key: "preferredBrands", label: "برندهای محبوب" },
    { key: "preferredNotes", label: "نت‌های مورد علاقه" },
    { key: "avoidNotes", label: "نت‌های نامطلوب" },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        {/* Header */}
        <header className="surface-card space-y-8 text-center sm:text-right">
          <div className="space-y-4">
            <h1 className="hero-headline text-center sm:text-right">
              پیشنهادهای اختصاصی شما
            </h1>
            <p className="text-lg text-muted">
              بر اساس پاسخ‌های شما، این عطرها از نظر خانواده رایحه، فصل مصرف، برند و نت‌های کلیدی هم‌خوانی دارند.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {summaryFields.map(({ key, label }) => (
              <div key={key as string} className="surface-subtle rounded-2xl p-4 text-right">
                <span className="block text-xs font-medium text-subtle">{label}</span>
                <p className="m-0 text-sm font-semibold text-[var(--color-foreground)]">
                  {answers[key].length > 0 ? answers[key].join("، ") : "انتخاب نشده"}
                </p>
              </div>
            ))}
          </div>
        </header>

        {/* Recommendations */}
        {recommendations.length > 0 ? (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-semibold text-[var(--color-foreground)]">
                بهترین تطابق‌ها برای شما
              </h2>
              <span className="text-sm text-muted">
                {recommendations.length} عطر با امتیاز بالا یافت شد
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {recommendations.map((perfume, index) => {
                const title = buildPerfumeTitle(perfume);
                const metaLine = buildMetaLine(perfume);
                return (
                  <article key={perfume.id} className="surface-card relative flex flex-col gap-5 rounded-3xl p-6">
                    <div className="absolute top-6 left-6 flex h-10 w-10 items-center justify-center rounded-full accent-fill text-lg font-bold">
                      {index + 1}
                    </div>

                    <div className="flex flex-col gap-3 text-right">
                      <h3 className="text-2xl font-semibold text-[var(--color-foreground)]">
                        {title}
                      </h3>
                      {perfume.nameEn && (
                        <p className="m-0 text-xs italic text-subtle">{perfume.nameEn}</p>
                      )}
                      {metaLine && (
                        <p className="m-0 text-sm text-subtle">{metaLine}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 justify-end text-xs">
                      {perfume.family && <span className="badge-soft">{perfume.family}</span>}
                      {perfume.character && <span className="badge-soft">{perfume.character}</span>}
                      {perfume.season && <span className="badge-soft">{perfume.season}</span>}
                      {perfume.gender && <span className="badge-soft">{perfume.gender}</span>}
                    </div>

                    {hasAnyNotes(perfume) && (
                      <div className="space-y-3 text-sm text-right text-muted">
                        {noteGroups.map(({ key, label }) => {
                          const values = perfume.notes[key];
                          if (!values || values.length === 0) {
                            return null;
                          }
                          return (
                            <div key={key} className="space-y-1">
                              <span className="font-medium text-subtle">{label}:</span>
                              <div className="flex flex-wrap gap-2 justify-end">
                                {values.map((note) => (
                                  <span key={note} className="badge-soft text-xs">
                                    {note}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {perfume.reasons.length > 0 && (
                      <div className="rounded-2xl bg-[var(--accent-soft)]/40 p-4 text-right text-sm text-muted">
                        <span className="block text-xs font-semibold text-[var(--color-accent)] mb-2">
                          چرا این عطر؟
                        </span>
                        <ul className="space-y-1">
                          {perfume.reasons.map((reason, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-2 border-t border-[var(--color-border)] pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-subtle">درصد تطابق</span>
                        <div className="flex items-center gap-2">
                          <div className="ml-2 h-2 w-24 rounded-full bg-soft">
                            <div
                              className="h-2 rounded-full bg-[var(--color-accent)]"
                              style={{ width: `${perfume.matchPercentage}%` }}
                            />
                          </div>
                          <span className="font-medium accent-text">
                            {perfume.matchPercentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="surface-card text-center space-y-4">
            <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
              هنوز تطابقی پیدا نشد
            </h2>
            <p className="text-muted text-sm">
              پاسخ‌های شما بسیار خاص بوده است. لطفاً برخی انتخاب‌ها را تغییر دهید و دوباره تلاش کنید.
            </p>
            <Link href="/questionnaire" className="btn tap-highlight">
              ویرایش پاسخ‌ها
            </Link>
          </section>
        )}

        {/* Action buttons */}
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/questionnaire"
            className="btn-ghost tap-highlight w-full sm:w-auto"
          >
            بازگشت به پرسشنامه
          </Link>
          <Link href="/" className="btn tap-highlight w-full sm:w-auto">
            بازگشت به خانه
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
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-dashed border-[var(--color-accent)]" />
        </div>
      }
    >
      <RecommendationsContent />
    </Suspense>
  );
}




