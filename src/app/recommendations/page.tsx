"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import MatchCard, {
  type CompactMode,
  type DisplayReason,
} from "@/components/recommendations/MatchCard";
import KioskFrame from "@/components/KioskFrame";
import { getPerfumes, toPersianNumbers } from "@/lib/api";
import { LABEL_LOOKUP } from "@/lib/kiosk-options";
import {
  TEXT as QUESTION_TEXT,
  SUMMARY_PREVIEW_LIMIT,
  type QuestionnaireAnswers,
  sanitizeAnswers,
  separatorJoin,
  QUESTION_CONFIG,
} from "@/lib/questionnaire";
import {
  describeMatchQuality,
  rankPerfumes,
  type MatchReason,
  type RankedPerfume,
} from "@/lib/recommendation-engine";

const TEXT = {
  loading: "در حال بارگذاری",
  noAnswers: "پاسخی ثبت نشد.",
  startQuestionnaire: "شروع پرسشنامه",
  heading: "پیشنهادهای شما",
  empty: "مورد مناسبی پیدا نشد. لطفاً پاسخ‌ها را تغییر دهید.",
  summaryHeading: "خلاصه انتخاب‌ها",
  refine: "ویرایش پاسخ‌ها",
  restart: "شروع دوباره",
  coverage: "پوشش ترجیحات",
  error: {
    heading: "خطا در دریافت پیشنهادها",
    description: "مشکلی در ارتباط با سرور رخ داد. لطفاً دوباره تلاش کنید.",
    retry: "تلاش مجدد",
  },
  intensity: {
    light: "ملایم",
    medium: "متعادل",
    strong: "قوی",
  } as const,
  reasons: {
    mood: "حال‌وهوا",
    moment: "موقعیت",
    time: "زمان استفاده",
    intensity: "شدت پخش بو",
    style: "سبک مورد انتظار",
    note: "یادداشت محبوب",
    synergy: "ترکیب انتخاب‌ها هماهنگ است",
  },
  warnings: {
    dislikePenalty: "برخی نُت‌های نامطلوب مشاهده شد",
    coveragePenalty: "پوشش ترجیحات اصلی کامل نیست",
  },
};

const STEP_KEYS = QUESTION_CONFIG.map((question) => question.key);

type IntensityKey = keyof typeof TEXT.intensity;

type ReasonCode = keyof typeof TEXT.reasons | keyof typeof TEXT.warnings;

type SummaryChip = { text: string; key: string };

const formatReason = (reason: MatchReason): DisplayReason | null => {
  const valueLabel = reason.value ? LABEL_LOOKUP[reason.value] ?? reason.value : undefined;

  switch (reason.code as ReasonCode) {
    case "mood":
    case "moment":
    case "time":
    case "intensity":
    case "style":
    case "note": {
      if (!valueLabel) return null;
      return {
        tone: reason.tone,
        text: `${TEXT.reasons[reason.code]}: ${valueLabel}`,
      };
    }
    case "synergy":
      return { tone: "positive", text: TEXT.reasons.synergy };
    case "dislikePenalty":
      return { tone: "warning", text: TEXT.warnings.dislikePenalty };
    case "coveragePenalty":
      return { tone: "warning", text: TEXT.warnings.coveragePenalty };
    default:
      return null;
  }
};

const buildSummary = (answers: QuestionnaireAnswers | null): SummaryChip[] => {
  if (!answers) return [];
  const chips: SummaryChip[] = [];
  const push = (key: string, text: string) => chips.push({ key, text });
  if (answers.moods.length) push("moods", `${QUESTION_TEXT.summaryLabels.moods}: ${separatorJoin(answers.moods)}`);
  if (answers.moments.length) push("moments", `${QUESTION_TEXT.summaryLabels.moments}: ${separatorJoin(answers.moments)}`);
  if (answers.times.length) push("times", `${QUESTION_TEXT.summaryLabels.times}: ${separatorJoin(answers.times)}`);
  if (answers.intensity.length) push("intensity", `${QUESTION_TEXT.summaryLabels.intensity}: ${separatorJoin(answers.intensity)}`);
  if (answers.styles.length) push("styles", `${QUESTION_TEXT.summaryLabels.styles}: ${separatorJoin(answers.styles)}`);
  if (answers.noteLikes.length) push("noteLikes", `${QUESTION_TEXT.summaryLabels.likes}: ${separatorJoin(answers.noteLikes)}`);
  if (answers.noteDislikes.length) push("noteDislikes", `${QUESTION_TEXT.summaryLabels.dislikes}: ${separatorJoin(answers.noteDislikes)}`);
  return chips.slice(0, SUMMARY_PREVIEW_LIMIT);
};

const RecommendationsContent: React.FC = () => {
  const searchParams = useSearchParams();
  const [recommendations, setRecommendations] = useState<RankedPerfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);
  const [compact, setCompact] = useState<CompactMode>("normal");
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const [matchPage, setMatchPage] = useState(0);


  useEffect(() => {
    if (typeof window === "undefined") return;
    const evaluate = () => {
      const height = window.innerHeight;
      if (height < 720) setCompact("ultra");
      else if (height < 880) setCompact("tight");
      else setCompact("normal");
    };
    evaluate();
    window.addEventListener("resize", evaluate);
    return () => window.removeEventListener("resize", evaluate);
  }, []);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const answersParam = searchParams.get("answers");
      if (!answersParam) {
        setAnswers(null);
        setRecommendations([]);
        return;
      }

      const parsed = JSON.parse(answersParam) as Partial<QuestionnaireAnswers>;
      const sanitized = sanitizeAnswers(parsed);
      setAnswers(sanitized);

      const allPerfumes = await getPerfumes();
      const ranked = rankPerfumes(allPerfumes, sanitized, 6);
      setRecommendations(ranked);
    } catch (err) {
      console.error("Error generating recommendations:", err);
      setError(TEXT.error.description);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations, retryToken]);


  useEffect(() => {
    setMatchPage(0);
  }, [recommendations.length]);

  const matchesPerPage = Math.min(3, recommendations.length || 3) || 3;
  const totalMatchPages = Math.max(1, Math.ceil(recommendations.length / matchesPerPage));

  useEffect(() => {
    if (matchPage >= totalMatchPages) {
      setMatchPage(totalMatchPages - 1);
    }
  }, [matchPage, totalMatchPages]);

  const visibleMatches = useMemo(
    () =>
      recommendations.slice(
        matchPage * matchesPerPage,
        matchPage * matchesPerPage + matchesPerPage
      ),
    [matchPage, matchesPerPage, recommendations]
  );



  const summaryChips = useMemo(() => buildSummary(answers), [answers]);

  const answersQuery = useMemo(() => {
    if (!answers) return null;
    return new URLSearchParams({ answers: JSON.stringify(answers) }).toString();
  }, [answers]);

  const refineHref = useMemo(() => {
    if (!answersQuery) return "/questionnaire";
    const params = new URLSearchParams(answersQuery);
    params.set("step", "review");
    return `/questionnaire?${params.toString()}`;
  }, [answersQuery]);

  const handleRetry = useCallback(() => {
    setRetryToken((token) => token + 1);
  }, []);

  if (loading) {
    return (
      <KioskFrame>
        <div className="flex min-h-full items-center justify-center">
          <div className="loader-orbit" role="status" aria-label={TEXT.loading} />
        </div>
      </KioskFrame>
    );
  }

  if (!answers) {
    return (
      <KioskFrame>
        <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="rounded-3xl border border-white/15 bg-white/8 p-8 shadow-soft backdrop-blur-2xl">
            <p className="text-base font-semibold text-[var(--color-foreground)]">{TEXT.noAnswers}</p>
            <Link
              href="/questionnaire"
              className="rounded-full border border-[var(--color-accent)] bg-[var(--color-accent)]/90 px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition-colors hover:bg-[var(--color-accent)]"
            >
              {TEXT.startQuestionnaire}
            </Link>
          </div>
        </div>
      </KioskFrame>
    );
  }

  return (

    <KioskFrame>
      <div className="flex min-h-full w-full items-center justify-center">
        <div className="relative z-10 flex w-full max-w-[760px] flex-col gap-6 px-5 py-6 sm:px-8">
          <div className="flex flex-col gap-5 rounded-[32px] border border-white/15 bg-white/10 p-6 shadow-strong backdrop-blur-2xl">
            <header className="flex flex-col gap-4 text-right">
              <div className="flex items-center justify-between text-xs text-muted">
                <h1 className="m-0 text-2xl font-semibold text-[var(--color-foreground)]">{TEXT.heading}</h1>
                <div className="flex items-center gap-2">
                  <Link
                    href={refineHref}
                    className="rounded-full border border-white/20 px-3 py-1 text-[11px] text-muted transition-colors hover:border-white/30 hover:bg-white/12 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  >
                    {TEXT.refine}
                  </Link>
                  <Link
                    href="/questionnaire"
                    className="rounded-full border border-[var(--color-accent)] bg-[var(--color-accent)]/90 px-3 py-1 text-[11px] font-semibold text-[var(--accent-contrast)] transition-colors hover:bg-[var(--color-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  >
                    {TEXT.restart}
                  </Link>
                </div>
              </div>

              {summaryChips.length > 0 && answersQuery && (
                <div className="flex flex-wrap justify-end gap-2 text-[11px] text-muted">
                  <span className="rounded-full border border-white/25 px-3 py-1 text-[var(--color-accent)]">
                    {TEXT.summaryHeading}
                  </span>
                  {summaryChips.map((chip, index) => {
                    const params = new URLSearchParams(answersQuery);
                    if (STEP_KEYS.includes(chip.key)) {
                      params.set("step", chip.key);
                    } else {
                      params.set("step", "review");
                    }
                    return (
                      <Link
                        key={`${chip.key}-${index}`}
                        href={`/questionnaire?${params.toString()}`}
                        className="rounded-full border border-white/20 bg-white/10 px-3 py-1 transition-colors hover:border-white/35"
                      >
                        {chip.text}
                      </Link>
                    );
                  })}
                </div>
              )}
            </header>

            <section className="flex flex-col gap-4">
              {error ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-white/15 bg-white/8 p-6 text-center text-sm text-muted">
                  <p className="m-0 text-base font-semibold text-[var(--color-foreground)]">{TEXT.error.heading}</p>
                  <p className="m-0 text-sm text-muted">{error}</p>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="rounded-full border border-[var(--color-accent)] bg-[var(--color-accent)]/90 px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition-colors hover:bg-[var(--color-accent)]"
                  >
                    {TEXT.error.retry}
                  </button>
                </div>
              ) : recommendations.length > 0 ? (
                <>
                  <div className="flex flex-col gap-3">
                    {visibleMatches.map((perfume, index) => {
                      const matchPercentLabel = `${toPersianNumbers(String(perfume.matchPercentage))}%`;
                      const matchQuality = describeMatchQuality(perfume.matchPercentage);
                      const coveragePercent = Math.round(perfume.coverage * 100);
                      const coverageLabel = `${TEXT.coverage}: ${toPersianNumbers(String(coveragePercent))}%`;
                      const intensityLabel = TEXT.intensity[perfume.intensityLevel as IntensityKey] ?? "";
                      const reasonMessages = perfume.reasons
                        .map(formatReason)
                        .filter((item): item is DisplayReason => item !== null);

                      return (
                        <MatchCard
                          key={perfume.id}
                          perfume={perfume}
                          order={matchPage * matchesPerPage + index + 1}
                          compact={compact === "normal" ? "tight" : compact}
                          reasons={reasonMessages}
                          matchPercentLabel={matchPercentLabel}
                          matchQuality={matchQuality}
                          coveragePercent={coveragePercent}
                          coverageLabel={coverageLabel}
                          intensityLabel={intensityLabel}
                        />
                      );
                    })}
                  </div>
                  {totalMatchPages > 1 && (
                    <div className="flex items-center justify-between gap-3 rounded-3xl border border-white/12 bg-white/6 px-4 py-3 text-xs text-muted">
                      <button
                        type="button"
                        onClick={() => setMatchPage((page) => Math.max(page - 1, 0))}
                        disabled={matchPage === 0}
                        className="rounded-full border border-white/20 px-3 py-1 transition-colors hover:border-white/30 hover:bg-white/12 disabled:opacity-40"
                      >
                        قبلی
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalMatchPages }).map((_, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setMatchPage(index)}
                            aria-label={`صفحه ${index + 1}`}
                            className={`h-2.5 w-2.5 rounded-full transition-colors ${
                              index === matchPage ? "bg-[var(--color-accent)]" : "bg-white/25 hover:bg-white/35"
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setMatchPage((page) => Math.min(page + 1, totalMatchPages - 1))}
                        disabled={matchPage === totalMatchPages - 1}
                        className="rounded-full border border-white/20 px-3 py-1 transition-colors hover:border-white/30 hover:bg-white/12 disabled:opacity-40"
                      >
                        بعدی
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center rounded-3xl border border-white/12 bg-white/6 p-6 text-sm text-muted">
                  {TEXT.empty}

                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </KioskFrame>
  );
};

const RecommendationsPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <KioskFrame>
          <div className="flex min-h-full items-center justify-center">
            <div className="loader-orbit" role="status" aria-label={TEXT.loading} />
          </div>
        </KioskFrame>
      }
    >
      <RecommendationsContent />
    </Suspense>
  );
};

export default RecommendationsPage;
