"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AnimatedBackground from "@/components/AnimatedBackground";
import { getPerfumes, toPersianNumbers } from "@/lib/api";
import {
  parseAnswers,
  type QuestionnaireAnswers,
} from "@/lib/questionnaire";
import { rankPerfumes, type RankedPerfume } from "@/lib/perfume-matcher";

const formatNumber = (value: number) => toPersianNumbers(String(value));

type CompactMode = "normal" | "tight" | "ultra";

const StateMessage = ({
  title,
  description,
  actionHref,
  actionLabel,
  secondaryAction,
}: {
  title: string;
  description?: string;
  actionHref: string;
  actionLabel: string;
  secondaryAction?: ReactNode;
}) => (
  <div className="relative flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
    <AnimatedBackground />
    <div className="relative z-10 space-y-3 rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-[32px]">
      <p className="text-base font-semibold text-[var(--color-foreground)]">{title}</p>
      {description && <p className="m-0 text-sm text-muted">{description}</p>}
      <div className="flex flex-col items-center gap-2">
        <Link href={actionHref} className="btn tap-highlight touch-target touch-feedback">
          {actionLabel}
        </Link>
        {secondaryAction}
      </div>
    </div>
  </div>
);

const MatchCard = ({
  perfume,
  order,
  compact = "normal",
}: {
  perfume: RankedPerfume;
  order: number;
  compact?: CompactMode;
}) => {
  const title = perfume.nameFa && perfume.nameFa.trim().length > 0 ? perfume.nameFa : perfume.nameEn;
  const subtitle = [perfume.brand, perfume.collection]
    .filter((v): v is string => !!v && v.trim().length > 0)
    .join(" • ");

  const imageHeight =
    compact === "ultra"
      ? "min(18vh, 120px)"
      : compact === "tight"
        ? "min(22vh, 150px)"
        : "min(26vh, 180px)";
  const maxBadges = compact === "ultra" ? 1 : compact === "tight" ? 2 : 3;
  const maxReasons = compact === "ultra" ? 0 : compact === "tight" ? 1 : 2;
  const showConfidence = compact !== "ultra";
  const showPreferenceSummary = compact !== "ultra" && perfume.consideredCorePreferences > 0;

  const badges = [perfume.family, perfume.character, perfume.season, perfume.gender]
    .filter((v): v is string => !!v && v.trim().length > 0)
    .slice(0, maxBadges);

  const reasonList = maxReasons > 0 ? perfume.reasons.slice(0, maxReasons) : [];

  return (
    <article className="glass-card flex h-full flex-col justify-between rounded-2xl p-4 text-right animate-fade-in-up">
      <header className="flex items-start justify-between">
        <span className="rounded-full bg-soft px-3 py-1 text-xs font-semibold text-muted">
          {formatNumber(order)}
        </span>
        <div className="text-right leading-tight">
          <span className="text-sm font-semibold text-[var(--color-accent)]">
            {formatNumber(perfume.matchPercentage)}%
          </span>
          {showConfidence && (
            <p className="m-0 text-[10px] text-muted">
              اعتماد: {formatNumber(perfume.confidence)}%
            </p>
          )}
        </div>
      </header>

      {perfume.image && (
        <div className="my-2 flex flex-grow justify-center">
          <div
            className="relative w-full flex-grow overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm"
            style={{ height: imageHeight }}
          >
            <Image
              src={perfume.image}
              alt={title}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          </div>
        </div>
      )}

      <div className="space-y-1">
        <h3 className={`font-semibold text-[var(--color-foreground)] ${compact === "ultra" ? "text-lg" : "text-xl"} line-clamp-1`}>
          {title}
        </h3>
        {compact !== "ultra" && perfume.nameEn && (
          <p className="m-0 text-xs italic text-subtle line-clamp-1">{perfume.nameEn}</p>
        )}
        {compact === "normal" && subtitle && (
          <p className="m-0 text-xs text-muted line-clamp-1">{subtitle}</p>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2 text-[10px] sm:text-xs text-muted">
        {badges.map((badge, index) => (
          <span key={index} className="badge-soft">
            {badge}
          </span>
        ))}
      </div>

      {showPreferenceSummary && (
        <p className="m-0 text-[10px] text-muted text-right">
          ترجیحات اصلی: {formatNumber(perfume.matchedCorePreferences)} از {formatNumber(perfume.consideredCorePreferences)}
        </p>
      )}

      {reasonList.length > 0 && (
        <ul className="mt-3 space-y-1 text-[11px] sm:text-xs text-muted">
          {reasonList.map((reason, index) => (
            <li key={index} className="line-clamp-2">
              {reason}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
};

function RecommendationsContent() {
  const searchParams = useSearchParams();
  const answersParam = searchParams.get("answers");
  const [recommendations, setRecommendations] = useState<RankedPerfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compact, setCompact] = useState<CompactMode>("normal");
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const updateCompact = () => {
      const height = window.innerHeight;
      if (height < 740) setCompact("ultra");
      else if (height < 900) setCompact("tight");
      else setCompact("normal");
    };
    updateCompact();
    window.addEventListener("resize", updateCompact);
    return () => window.removeEventListener("resize", updateCompact);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!answersParam) {
      setAnswers(null);
      setRecommendations([]);
      setError(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const parsedAnswers = parseAnswers(answersParam);
    if (!parsedAnswers) {
      setAnswers(null);
      setRecommendations([]);
      setError("پاسخ‌ها معتبر نیستند. لطفاً پرسشنامه را مجدداً تکمیل کنید.");
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setAnswers(parsedAnswers);
    setLoading(true);
    setError(null);

    const fetchRecommendations = async () => {
      try {
        const allPerfumes = await getPerfumes();
        if (cancelled) return;
        const ranked = rankPerfumes(allPerfumes, parsedAnswers).slice(0, 6);
        setRecommendations(ranked);
      } catch (err) {
        if (cancelled) return;
        console.error("Error generating recommendations:", err);
        setRecommendations([]);
        setError("در تهیه پیشنهادها خطایی رخ داد. لطفاً دوباره تلاش کنید.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRecommendations();

    return () => {
      cancelled = true;
    };
  }, [answersParam, refreshToken]);

  if (loading) {
    return (
      <div className="relative flex h-screen items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 loader-orbit" role="status" aria-label="در حال بارگذاری" />
      </div>
    );
  }

  if (error) {
    return (
      <StateMessage
        title="مشکلی پیش آمد."
        description={error}
        actionHref="/questionnaire"
        actionLabel="بازگشت به پرسشنامه"
        secondaryAction={
          <button
            type="button"
            onClick={() => setRefreshToken((token) => token + 1)}
            className="btn-ghost tap-highlight touch-target touch-feedback"
          >
            تلاش مجدد
          </button>
        }
      />
    );
  }

  if (!answers) {
    return (
      <StateMessage
        title="پاسخی ثبت نشد."
        description="برای دریافت پیشنهادها، پرسشنامه را تکمیل کنید."
        actionHref="/questionnaire"
        actionLabel="شروع پرسشنامه"
      />
    );
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center px-4 lg:px-8">
      <AnimatedBackground />
      <div className="relative flex h-[92vh] w-full max-w-[1400px] flex-col gap-6 rounded-3xl bg-white/8 backdrop-blur-[48px] border border-white/15 px-6 py-6 shadow-2xl animate-blur-in">
        <header className="flex items-center justify-between animate-slide-in-right">
          <h1 className="text-3xl font-semibold text-[var(--color-foreground)]">پیشنهادهای شما</h1>
          {recommendations.length > 0 && (
            <span className="text-xs text-muted">
              {formatNumber(recommendations.length)} مورد بر اساس ترجیحات شما تنظیم شد.
            </span>
          )}
        </header>

        <section className="grid flex-1 grid-cols-3 grid-rows-2 auto-rows-fr gap-3 xl:gap-4 animate-scale-in animate-delay-2">
          {recommendations.length > 0 ? (
            recommendations.map((perfume, index) => (
              <div
                key={perfume.id}
                className={`h-full animate-fade-in-up animate-delay-${Math.min(index + 3, 5)}`}
              >
                <MatchCard perfume={perfume} order={index + 1} compact={compact} />
              </div>
            ))
          ) : (
            <div className="glass-surface col-span-full flex h-full flex-col items-center justify-center gap-3 rounded-3xl text-sm text-muted animate-fade-in-up animate-delay-3">
              <p className="m-0">مورد مناسبی پیدا نشد. لطفاً پاسخ‌ها را تغییر دهید.</p>
              <Link href="/questionnaire" className="btn-ghost tap-highlight touch-target touch-feedback">
                بازنگری پرسشنامه
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex h-screen items-center justify-center">
          <AnimatedBackground />
          <div className="relative z-10 loader-orbit" role="status" aria-label="در حال بارگذاری" />
        </div>
      }
    >
      <RecommendationsContent />
    </Suspense>
  );
}
