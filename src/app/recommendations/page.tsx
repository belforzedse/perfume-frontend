"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AnimatedBackground from "@/components/AnimatedBackground";
import { getPerfumes, type Perfume } from "@/lib/api";
import { LABEL_LOOKUP, NOTE_CHOICES } from "@/lib/kiosk-options";

interface QuestionnaireAnswers {
  moods: string[];
  moments: string[];
  times: string[];
  intensity: string[];
  styles: string[];
  noteLikes: string[];
  noteDislikes: string[];
}

type RankedPerfume = Perfume & {
  score: number;
  maxScore: number;
  matchPercentage: number;
  reasons: string[];
};

const WEIGHTS = {
  moods: 28,
  moments: 18,
  times: 10,
  intensity: 12,
  styles: 8,
  notes: 18,
  synergy: 8,
} as const;

const STRONG_KEYWORDS = [
  "intense",
  "rich",
  "deep",
  "oud",
  "oriental",
  "amber",
  "noir",
  "night",
  "warm",
];
const LIGHT_KEYWORDS = [
  "light",
  "soft",
  "fresh",
  "clean",
  "citrus",
  "airy",
  "green",
  "bright",
];

const NOTE_KEYWORDS: Record<string, string[]> = Object.fromEntries(
  NOTE_CHOICES.map((choice) => [choice.value, choice.keywords])
);

const MOOD_PROFILES: Record<
  string,
  { families: string[]; characters: string[]; notes: string[] }
> = {
  fresh: {
    families: ["fresh", "citrus", "aquatic", "green", "aromatic"],
    characters: ["fresh", "cool", "clean", "energetic", "marine", "crisp"],
    notes: [...NOTE_KEYWORDS.citrus, ...NOTE_KEYWORDS.green],
  },
  sweet: {
    families: ["gourmand", "sweet", "oriental"],
    characters: ["sweet", "gourmand", "creamy", "dessert"],
    notes: [...NOTE_KEYWORDS.sweet],
  },
  warm: {
    families: ["spicy", "oriental", "amber"],
    characters: ["warm", "spicy", "amber", "sensual"],
    notes: [...NOTE_KEYWORDS.spicy, ...NOTE_KEYWORDS.oriental],
  },
  floral: {
    families: ["floral", "powdery"],
    characters: ["floral", "soft", "romantic", "powdery"],
    notes: [...NOTE_KEYWORDS.floral, ...NOTE_KEYWORDS.musky],
  },
  woody: {
    families: ["woody", "chypre", "mossy"],
    characters: ["wood", "earthy", "classic", "smoky"],
    notes: [...NOTE_KEYWORDS.woody, "patchouli", "leather"],
  },
};

const MOMENT_PROFILES: Record<
  string,
  {
    seasons?: string[];
    intensity?: Array<"light" | "medium" | "strong">;
    characters?: string[];
    notes?: string[];
  }
> = {
  daily: {
    seasons: ["all", "cool", "warm"],
    intensity: ["light", "medium"],
    characters: ["fresh", "clean", "soft", "balanced"],
  },
  evening: {
    seasons: ["cool", "cold"],
    intensity: ["medium", "strong"],
    characters: ["warm", "sweet", "intense", "sensual"],
  },
  outdoor: {
    seasons: ["warm", "all"],
    intensity: ["light", "medium"],
    characters: ["fresh", "green", "citrus", "airy"],
    notes: [...NOTE_KEYWORDS.citrus, ...NOTE_KEYWORDS.green],
  },
  gift: {
    seasons: ["all"],
    intensity: ["light", "medium"],
    characters: ["soft", "smooth", "elegant"],
    notes: [...NOTE_KEYWORDS.floral, ...NOTE_KEYWORDS.sweet],
  },
};

const TIME_PROFILES: Record<
  string,
  { characters: string[]; intensity?: Array<"light" | "medium" | "strong"> }
> = {
  day: {
    characters: ["fresh", "clean", "bright", "light"],
    intensity: ["light", "medium"],
  },
  night: {
    characters: ["warm", "intense", "sensual", "deep"],
    intensity: ["medium", "strong"],
  },
  anytime: {
    characters: ["versatile", "balanced"],
  },
};

const STYLE_MAP: Record<string, string[]> = {
  feminine: ["female"],
  masculine: ["male"],
  unisex: ["unisex"],
  any: ["female", "male", "unisex"],
};

const normalize = (value?: string) => value?.toLowerCase() ?? "";

const includesAny = (target: string, keywords: string[]) =>
  keywords.some((keyword) => target.includes(keyword));

const notesMatch = (notes: string[], keywords: string[]) =>
  keywords.some((keyword) => notes.some((note) => note.includes(keyword)));

const deriveIntensity = (perfume: Perfume): "light" | "medium" | "strong" => {
  const base = `${perfume.character ?? ""} ${perfume.family ?? ""}`.toLowerCase();
  if (STRONG_KEYWORDS.some((keyword) => base.includes(keyword))) return "strong";
  if (LIGHT_KEYWORDS.some((keyword) => base.includes(keyword))) return "light";
  const noteCount = perfume.allNotes.length;
  if (noteCount >= 9) return "strong";
  if (noteCount <= 4) return "light";
  return "medium";
};

const mapSeason = (season?: string) => {
  const normalized = normalize(season);
  if (normalized.includes("warm")) return "warm";
  if (normalized.includes("cold")) return "cold";
  if (normalized.includes("cool")) return "cool";
  return "all";
};

const moodScore = (perfume: Perfume, value: string, notes: string[]) => {
  const profile = MOOD_PROFILES[value];
  if (!profile) return 0;
  const family = normalize(perfume.family);
  const character = normalize(perfume.character);
  let score = 0;
  if (includesAny(family, profile.families)) score += 0.4;
  if (includesAny(character, profile.characters)) score += 0.4;
  if (notesMatch(notes, profile.notes)) score += 0.2;
  return score;
};

const momentScore = (
  perfume: Perfume,
  value: string,
  intensity: "light" | "medium" | "strong",
  notes: string[]
) => {
  const profile = MOMENT_PROFILES[value];
  if (!profile) return 0;
  const seasonMatch = profile.seasons?.includes(mapSeason(perfume.season)) ? 0.4 : 0;
  const intensityMatch = profile.intensity?.includes(intensity) ? 0.3 : 0;
  const characterMatch =
    profile.characters && includesAny(normalize(perfume.character), profile.characters)
      ? 0.2
      : 0;
  const noteMatch = profile.notes && notesMatch(notes, profile.notes) ? 0.1 : 0;
  return seasonMatch + intensityMatch + characterMatch + noteMatch;
};

const timeScore = (
  perfume: Perfume,
  value: string,
  intensity: "light" | "medium" | "strong"
) => {
  const profile = TIME_PROFILES[value];
  if (!profile) return 0;
  const charMatch = includesAny(normalize(perfume.character), profile.characters) ? 0.6 : 0;
  const intensityMatch = profile.intensity?.includes(intensity) ? 0.4 : 0;
  return charMatch + intensityMatch;
};

const intensityScore = (perfumeIntensity: string, desired: string[]) => {
  if (desired.length === 0) return 0;
  const wanted = desired[0];
  if (wanted === perfumeIntensity) return 1;
  if (wanted === "medium" || perfumeIntensity === "medium") return 0.6;
  return 0.2;
};

const styleScore = (perfume: Perfume, styles: string[]) => {
  if (styles.length === 0) return 0;
  const gender = normalize(perfume.gender);
  const preferred = STYLE_MAP[styles[0]] ?? STYLE_MAP.any;
  return preferred.includes(gender) ? 1 : 0.3;
};

const notePreferenceScore = (
  notes: string[],
  desired: string[]
): { score: number; best: string | null } => {
  if (desired.length === 0) return { score: 0, best: null };
  let matches = 0;
  let bestValue: string | null = null;
  let bestHits = -1;
  for (const value of desired) {
    const keywords = NOTE_KEYWORDS[value] ?? [];
    const hits = keywords.filter((keyword) => notes.some((note) => note.includes(keyword))).length;
    if (hits > 0) {
      matches += 1;
      if (hits > bestHits) {
        bestHits = hits;
        bestValue = value;
      }
    }
  }
  return { score: matches / desired.length, best: bestValue };
};

const hasDislikedNotes = (notes: string[], dislikes: string[]) =>
  dislikes.some((value) => {
    const keywords = NOTE_KEYWORDS[value] ?? [];
    return notesMatch(notes, keywords);
  });

const computeScore = (
  perfume: Perfume,
  answers: QuestionnaireAnswers
): RankedPerfume | null => {
  const notes = perfume.allNotes.map((note) => note.toLowerCase());
  if (hasDislikedNotes(notes, answers.noteDislikes)) return null;

  const components: Array<{
    id: keyof typeof WEIGHTS | "notes";
    weight: number;
    achieved: number;
    reason?: string;
  }> = [];
  const reasons: string[] = [];
  const perfumeIntensity = deriveIntensity(perfume);

  const addComponent = (
    id: keyof typeof WEIGHTS | "notes",
    weight: number,
    achieved: number,
    reason?: string
  ) => {
    components.push({ id, weight, achieved, reason });
    if (achieved >= 0.55 && reason) reasons.push(reason);
  };

  if (answers.moods.length) {
    let total = 0;
    let strongest: { value: string; ratio: number } | null = null;
    answers.moods.forEach((value) => {
      const ratio = moodScore(perfume, value, notes);
      total += ratio;
      if (!strongest || ratio > strongest.ratio) strongest = { value, ratio };
    });
    const achieved = total / answers.moods.length;
    let moodReason: string | undefined;
    {
      const s = strongest as unknown as { value: string; ratio: number } | null;
      if (s && s.ratio >= 0.55) {
        moodReason = `حال‌وهوا: ${LABEL_LOOKUP[s.value]}`;
      }
    }
    addComponent("moods", WEIGHTS.moods, achieved, moodReason);
  }

  if (answers.moments.length) {
    let total = 0;
    let strongest: { value: string; ratio: number } | null = null;
    answers.moments.forEach((value) => {
      const ratio = momentScore(perfume, value, perfumeIntensity, notes);
      total += ratio;
      if (!strongest || ratio > strongest.ratio) strongest = { value, ratio };
    });
    const achieved = total / answers.moments.length;
    let momentReason: string | undefined;
    {
      const s2 = strongest as unknown as { value: string; ratio: number } | null;
      if (s2 && s2.ratio >= 0.5) {
        momentReason = `موقعیت: ${LABEL_LOOKUP[s2.value]}`;
      }
    }
    addComponent("moments", WEIGHTS.moments, achieved, momentReason);
  }

  if (answers.times.length) {
    const ratio = timeScore(perfume, answers.times[0], perfumeIntensity);
    addComponent(
      "times",
      WEIGHTS.times,
      ratio,
      ratio >= 0.55 ? `زمان: ${LABEL_LOOKUP[answers.times[0]]}` : undefined
    );
  }

  if (answers.intensity.length) {
    const ratio = intensityScore(perfumeIntensity, answers.intensity);
    addComponent(
      "intensity",
      WEIGHTS.intensity,
      ratio,
      ratio >= 0.6 ? `شدت: ${LABEL_LOOKUP[answers.intensity[0]]}` : undefined
    );
  }

  if (answers.styles.length) {
    const ratio = styleScore(perfume, answers.styles);
    addComponent(
      "styles",
      WEIGHTS.styles,
      ratio,
      ratio >= 0.7 ? `سبک: ${LABEL_LOOKUP[answers.styles[0]]}` : undefined
    );
  }

  const noteFeedback = notePreferenceScore(notes, answers.noteLikes);
  if (answers.noteLikes.length) {
    addComponent(
      "notes",
      WEIGHTS.notes,
      noteFeedback.score,
      noteFeedback.best ? `یادداشت محبوب: ${LABEL_LOOKUP[noteFeedback.best]}` : undefined
    );
  }

  const maxScore = components.reduce((sum, item) => sum + item.weight, 0);
  if (maxScore === 0) {
    return { ...perfume, score: 0, maxScore: 0, matchPercentage: 0, reasons: [] };
  }

  const coreMatches = components
    .filter((item) => ["moods", "moments", "times", "intensity", "styles"].includes(item.id))
    .filter((item) => item.achieved >= 0.6).length;
  if (coreMatches >= 3) addComponent("synergy", WEIGHTS.synergy, 1, "هماهنگی خوب بین ترجیحات شما");

  const score = components.reduce((sum, item) => sum + item.weight * item.achieved, 0);
  const matchPercentage = Math.round((score / maxScore) * 100);
  return { ...perfume, score, maxScore, matchPercentage, reasons };
};

type CompactMode = "normal" | "tight" | "ultra";

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

  const imageHeight = compact === "ultra" ? "min(18vh, 120px)" : compact === "tight" ? "min(22vh, 150px)" : "min(26vh, 180px)";
  const maxBadges = compact === "ultra" ? 1 : compact === "tight" ? 2 : 3;
  const maxReasons = compact === "ultra" ? 0 : compact === "tight" ? 1 : 2;

  const badges = [perfume.family, perfume.character, perfume.season, perfume.gender]
    .filter((v): v is string => !!v && v.trim().length > 0)
    .slice(0, maxBadges);

  return (
    <article className="glass-card flex h-full flex-col justify-between rounded-2xl p-4 text-right animate-fade-in-up">
      <header className="flex items-start justify-between">
        <span className="rounded-full bg-soft px-3 py-1 text-xs font-semibold text-muted">{order}</span>
        <span className="text-sm font-semibold text-[var(--color-accent)]">{perfume.matchPercentage}%</span>
      </header>

      {perfume.image && (
        <div className="flex-grow flex justify-center my-2">
          <div className="relative w-full flex-grow overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm" style={{ height: imageHeight }}>
            <Image src={perfume.image} alt={title} fill className="object-contain" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" priority />
          </div>
        </div>
      )}

      <div className="space-y-1">
        <h3 className={`font-semibold text-[var(--color-foreground)] ${compact === "ultra" ? "text-lg" : "text-xl"} line-clamp-1`}>{title}</h3>
        {compact !== "ultra" && perfume.nameEn && <p className="m-0 text-xs italic text-subtle line-clamp-1">{perfume.nameEn}</p>}
        {compact === "normal" && subtitle && <p className="m-0 text-xs text-muted line-clamp-1">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap justify-end gap-2 text-[10px] sm:text-xs text-muted">
        {badges.map((b, i) => (
          <span key={i} className="badge-soft">{b}</span>
        ))}
      </div>
      {maxReasons > 0 && perfume.reasons.length > 0 && (
        <ul className="mt-3 space-y-1 text-[11px] sm:text-xs text-muted">
          {perfume.reasons.slice(0, maxReasons).map((reason, index) => (
            <li key={index} className="line-clamp-2">{reason}</li>
          ))}
        </ul>
      )}
    </article>
  );
};

function RecommendationsContent() {
  const searchParams = useSearchParams();
  const [recommendations, setRecommendations] = useState<RankedPerfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);
  const [compact, setCompact] = useState<CompactMode>("normal");

  useEffect(() => {
    const update = () => {
      const h = window.innerHeight;
      if (h < 740) setCompact("ultra");
      else if (h < 900) setCompact("tight");
      else setCompact("normal");
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    async function generate() {
      try {
        const answersParam = searchParams.get("answers");
        if (!answersParam) {
          setLoading(false);
          return;
        }
        const parsed = JSON.parse(answersParam) as unknown;
        const userAnswers = parsed as QuestionnaireAnswers;
        setAnswers(userAnswers);
        const allPerfumes = await getPerfumes();
        const ranked = allPerfumes
          .map((perfume) => computeScore(perfume, userAnswers))
          .filter((item): item is RankedPerfume => item !== null)
          .sort((a, b) => b.matchPercentage - a.matchPercentage || b.score - a.score)
          .slice(0, 6)
          .map((item) => ({ ...item, matchPercentage: Math.min(100, Math.max(0, item.matchPercentage)) }));
        setRecommendations(ranked);
      } catch (error) {
        console.error("Error generating recommendations:", error);
      } finally {
        setLoading(false);
      }
    }
    generate();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="relative flex h-screen items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 loader-orbit" role="status" aria-label="در حال بارگذاری" />
      </div>
    );
  }

  if (!answers) {
    return (
      <div className="relative flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <AnimatedBackground />
        <div className="relative z-10 bg-white/10 backdrop-blur-[32px] border border-white/20 rounded-3xl p-8">
          <p className="text-base font-semibold text-[var(--color-foreground)]">پاسخی ثبت نشد.</p>
          <Link href="/questionnaire" className="btn tap-highlight touch-target touch-feedback">
            شروع پرسشنامه
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center px-4 lg:px-8">
      <AnimatedBackground />
      <div className="relative flex h-[92vh] w-full max-w-[1400px] flex-col gap-6 rounded-3xl bg-white/8 backdrop-blur-[48px] border border-white/15 px-6 py-6 shadow-2xl animate-blur-in">
        <header className="flex items-center justify-between animate-slide-in-right">
          <h1 className="text-3xl font-semibold text-[var(--color-foreground)]">پیشنهادهای شما</h1>
        </header>

        <section className="grid flex-1 grid-cols-3 grid-rows-2 auto-rows-fr gap-3 xl:gap-4 animate-scale-in animate-delay-2">
          {recommendations.length > 0 ? (
            recommendations.map((perfume, index) => (
              <div key={perfume.id} className={`h-full animate-fade-in-up animate-delay-${Math.min(index + 3, 5)}`}>
                <MatchCard perfume={perfume} order={index + 1} compact={compact} />
              </div>
            ))
          ) : (
            <div className="glass-surface col-span-full flex h-full items-center justify-center rounded-3xl text-sm text-muted animate-fade-in-up animate-delay-3">
              مورد مناسبی پیدا نشد. لطفاً پاسخ‌ها را تغییر دهید.
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

