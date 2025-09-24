"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import KioskFrame from "@/components/KioskFrame";
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
  <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
    <div className="space-y-3 rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-[32px]">
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
  const detailLine = [perfume.collection, perfume.family]
    .filter((v): v is string => !!v && v.trim().length > 0)
    .join(" • ");

  const imageHeight =
    compact === "ultra"
      ? "min(18vh, 120px)"
      : compact === "tight"
        ? "min(22vh, 150px)"
        : "min(26vh, 180px)";
  const brand = perfume.brand?.trim();
  const englishName = perfume.nameEn?.trim();

  return (
    <article className="glass-card flex h-full flex-col gap-5 rounded-3xl p-6 text-right animate-fade-in-up">
      <header className="flex items-center justify-between text-muted">
        <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-[var(--color-foreground)]">
          {formatNumber(order)}
        </span>
        <span className="text-sm font-semibold text-[var(--color-foreground)]">
          {formatNumber(perfume.matchPercentage)}٪
        </span>
      </header>

      {perfume.image && (
        <div className="flex flex-grow items-center justify-center">
          <div
            className="relative w-full overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm"
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

      <div className="space-y-2 text-right">
        {brand && (
          <p className="m-0 text-[11px] uppercase tracking-[0.3em] text-muted line-clamp-1">
            {brand}
          </p>
        )}
        <h3
          className={`m-0 font-semibold text-[var(--color-foreground)] ${compact === "ultra" ? "text-lg" : "text-2xl"} line-clamp-1`}
        >
          {title}
        </h3>
        {compact !== "ultra" && englishName && (
          <p className="m-0 text-xs text-subtle line-clamp-1">{englishName}</p>
        )}
        {compact === "normal" && detailLine && (
          <p className="m-0 text-xs text-muted line-clamp-1">{detailLine}</p>
        )}
      </div>
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
      <div className="flex h-full items-center justify-center">
        <div className="loader-orbit" role="status" aria-label="در حال بارگذاری" />
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
    <div className="flex h-full w-full items-center justify-center px-4 lg:px-8">
      <div className="glass-card relative flex h-[92vh] w-full max-w-[1400px] flex-col gap-6 rounded-[32px] px-6 py-6 animate-blur-in">
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
    <KioskFrame>
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <div className="loader-orbit" role="status" aria-label="در حال بارگذاری" />
          </div>
        }
      >
        <RecommendationsContent />
      </Suspense>
    </KioskFrame>
  );
}
