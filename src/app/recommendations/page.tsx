"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import AnimatedBackground from "@/components/AnimatedBackground";
import MatchCard, {
  type CompactMode,
  type DisplayReason,
} from "@/components/recommendations/MatchCard";
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
      <div className="relative flex h-screen items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 loader-orbit" role="status" aria-label={TEXT.loading} />
      </div>
    );
  }

  if (!answers) {
    return (
      <div className="relative flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <AnimatedBackground />
        <div className="relative z-10 rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-[32px]">
          <p className="text-base font-semibold text-[var(--color-foreground)]">{TEXT.noAnswers}</p>
          <Link href="/questionnaire" className="btn tap-highlight touch-target touch-feedback">
            {TEXT.startQuestionnaire}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center px-4 lg:px-8">
      <AnimatedBackground />
      <div className="relative flex h-[92vh] w-full max-w-[1400px] flex-col gap-6 overflow-hidden rounded-3xl glass-deep px-6 py-6 shadow-2xl animate-blur-in">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between animate-slide-in-right">
          <div className="space-y-1 text-right">
            <h1 className="text-3xl font-semibold text-[var(--color-foreground)]">{TEXT.heading}</h1>
            {summaryChips.length > 0 && answersQuery && (
              <div className="flex flex-wrap justify-end gap-2 text-xs text-muted">
                <span className="rounded-full border border-white/25 px-3 py-1 font-semibold text-[var(--color-accent)]">
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
                      className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs transition-colors hover:border-white/35 tap-highlight touch-target"
                    >
                      {chip.text}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3">
            <Link href={refineHref} className="btn-ghost tap-highlight touch-target touch-feedback">
              {TEXT.refine}
            </Link>
            <Link href="/questionnaire" className="btn tap-highlight touch-target touch-feedback">
              {TEXT.restart}
            </Link>
          </div>
        </header>

        <section className="grid flex-1 auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-3 animate-scale-in animate-delay-2">
          {error ? (
            <div className="glass-surface col-span-full flex h-full flex-col items-center justify-center gap-3 rounded-3xl px-6 text-center text-sm text-muted animate-fade-in-up animate-delay-3">
              <p className="m-0 text-base font-semibold text-[var(--color-foreground)]">{TEXT.error.heading}</p>
              <p className="m-0 text-sm text-muted">{error}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="btn tap-highlight touch-target touch-feedback"
              >
                {TEXT.error.retry}
              </button>
            </div>
          ) : recommendations.length > 0 ? (
            recommendations.map((perfume, index) => {
              const matchPercentLabel = `${toPersianNumbers(String(perfume.matchPercentage))}%`;
              const matchQuality = describeMatchQuality(perfume.matchPercentage);
              const coveragePercent = Math.round(perfume.coverage * 100);
              const coverageLabel = `${TEXT.coverage}: ${toPersianNumbers(String(coveragePercent))}%`;
              const intensityLabel = TEXT.intensity[perfume.intensityLevel as IntensityKey] ?? "";
              const reasonMessages = perfume.reasons
                .map(formatReason)
                .filter((item): item is DisplayReason => item !== null);

              return (
                <div key={perfume.id} className={`h-full animate-fade-in-up animate-delay-${Math.min(index + 3, 5)}`}>
                  <MatchCard
                    perfume={perfume}
                    order={index + 1}
                    compact={compact}
                    reasons={reasonMessages}
                    matchPercentLabel={matchPercentLabel}
                    matchQuality={matchQuality}
                    coveragePercent={coveragePercent}
                    coverageLabel={coverageLabel}
                    intensityLabel={intensityLabel}
                  />
                </div>
              );
            })
          ) : (
            <div className="glass-surface col-span-full flex h-full items-center justify-center rounded-3xl text-sm text-muted animate-fade-in-up animate-delay-3">
              {TEXT.empty}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const RecommendationsPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="relative flex h-screen items-center justify-center">
          <AnimatedBackground />
          <div className="relative z-10 loader-orbit" role="status" aria-label={TEXT.loading} />
        </div>
      }
    >
      <RecommendationsContent />
    </Suspense>
  );
};

export default RecommendationsPage;
