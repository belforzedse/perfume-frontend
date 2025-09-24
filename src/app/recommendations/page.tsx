"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AnimatedBackground from "@/components/AnimatedBackground";
import TouchRipple from "@/components/TouchRipple";
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

const PENALTY_WEIGHTS = {
  dislikes: 14,
  weakCoverage: 10,
} as const;

const TEXT = {
  loading: "\u062F\u0631 \u062D\u0627\u0644 \u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC",
  noAnswers: "\u067E\u0627\u0633\u062E\u06CC \u062B\u0628\u062A \u0646\u0634\u062F.",
  startQuestionnaire: "\u0634\u0631\u0648\u0639 \u067E\u0631\u0633\u0634\u0646\u0627\u0645\u0647",
  heading: "\u067E\u06CC\u0634\u0646\u0647\u0627\u062F\u0647\u0627\u06CC \u0634\u0645\u0627",
  empty: "\u0645\u0648\u0631\u062F \u0645\u0646\u0627\u0633\u0628\u06CC \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F. \u0644\u0637\u0641\u0627\u064B \u067E\u0627\u0633\u062E\u200C\u0647\u0627 \u0631\u0627 \u062A\u063A\u06CC\u06CC\u0631 \u062F\u0647\u06CC\u062F.",
  reasonMood: "\u062D\u0627\u0644\u200C\u0648\u0647\u0648\u0627",
  reasonMoment: "\u0645\u0648\u0642\u0639\u06CC\u062A",
  reasonTime: "\u0632\u0645\u0627\u0646 \u0627\u0633\u062A\u0641\u0627\u062F\u0647",
  reasonIntensity: "\u0634\u062F\u062A \u067E\u062E\u0634 \u0628\u0648",
  reasonStyle: "\u0633\u0628\u06A9 \u0645\u0648\u0631\u062F \u0627\u0646\u062A\u0638\u0627\u0631",
  reasonNotes: "\u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u0645\u062D\u0628\u0648\u0628",
  penaltyDislikes: "\u0628\u0631\u062E\u06CC \u0646\u064F\u062A\u200C\u0647\u0627\u06CC \u0646\u0627\u0645\u0637\u0644\u0648\u0628 \u0634\u0646\u0627\u0633\u0627\u06CC\u06CC \u0634\u062F",
  synergy: "\u062A\u0631\u06A9\u06CC\u0628 \u0627\u0646\u062A\u062E\u0627\u0628\u200C\u0647\u0627 \u0628\u0633\u06CC\u0627\u0631 \u0647\u0645\u0627\u0647\u0646\u06AF \u0627\u0633\u062A",
  weakCoverage: "\u067E\u0648\u0634\u0634 \u062A\u0631\u062C\u06CC\u062D\u0627\u062A \u0627\u0635\u0644\u06CC \u06A9\u0627\u0645\u0644 \u0646\u06CC\u0633\u062A",
};

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
    notes: [...(NOTE_KEYWORDS.citrus ?? []), ...(NOTE_KEYWORDS.green ?? [])],
  },
  sweet: {
    families: ["gourmand", "sweet", "oriental"],
    characters: ["sweet", "gourmand", "creamy", "dessert"],
    notes: [...(NOTE_KEYWORDS.sweet ?? [])],
  },
  warm: {
    families: ["spicy", "oriental", "amber"],
    characters: ["warm", "spicy", "amber", "sensual"],
    notes: [...(NOTE_KEYWORDS.spicy ?? []), ...(NOTE_KEYWORDS.oriental ?? [])],
  },
  floral: {
    families: ["floral", "powdery"],
    characters: ["floral", "soft", "romantic", "powdery"],
    notes: [...(NOTE_KEYWORDS.floral ?? []), ...(NOTE_KEYWORDS.musky ?? [])],
  },
  woody: {
    families: ["woody", "chypre", "mossy"],
    characters: ["wood", "earthy", "classic", "smoky"],
    notes: [...(NOTE_KEYWORDS.woody ?? []), "patchouli", "leather"],
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
    notes: [...(NOTE_KEYWORDS.citrus ?? []), ...(NOTE_KEYWORDS.green ?? [])],
  },
  gift: {
    seasons: ["all"],
    intensity: ["light", "medium"],
    characters: ["soft", "smooth", "elegant"],
    notes: [...(NOTE_KEYWORDS.floral ?? []), ...(NOTE_KEYWORDS.sweet ?? [])],
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
  const base = `${perfume.character ?? ""} ${
    perfume.family ?? ""
  }`.toLowerCase();
  if (STRONG_KEYWORDS.some((keyword) => base.includes(keyword)))
    return "strong";
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
  const seasonMatch = profile.seasons?.includes(mapSeason(perfume.season))
    ? 0.4
    : 0;
  const intensityMatch = profile.intensity?.includes(intensity) ? 0.3 : 0;
  const characterMatch =
    profile.characters &&
    includesAny(normalize(perfume.character), profile.characters)
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
  const charMatch = includesAny(
    normalize(perfume.character),
    profile.characters
  )
    ? 0.6
    : 0;
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
    const hits = keywords.filter((keyword) =>
      notes.some((note) => note.includes(keyword))
    ).length;
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

const dislikedMatches = (notes: string[], dislikes: string[]) =>
  dislikes.reduce((total, value) => {
    const keywords = NOTE_KEYWORDS[value] ?? [];
    const hits = keywords.filter((keyword) =>
      notes.some((note) => note.includes(keyword))
    ).length;
    return total + hits;
  }, 0);

const computeScore = (
  perfume: Perfume,
  answers: QuestionnaireAnswers
): RankedPerfume | null => {
  const notes = perfume.allNotes.map((note) => note.toLowerCase());
  const dislikeHits = dislikedMatches(notes, answers.noteDislikes);

  const components: Array<{
    id: keyof typeof WEIGHTS | "notes";
    weight: number;
    achieved: number;
    reason?: string;
  }> = [];
  let penaltyScore = 0;
  const reasons: string[] = [];
  const perfumeIntensity = deriveIntensity(perfume);

  const addComponent = (
    id: keyof typeof WEIGHTS | "notes",
    weight: number,
    achieved: number,
    reason?: string
  ) => {
    components.push({ id, weight, achieved, reason });
    if (reason && achieved >= 0.55) {
      reasons.push(reason);
    }
  };

  const addPenalty = (weight: number, severity: number, reason?: string) => {
    penaltyScore += weight * Math.min(Math.max(severity, 0), 1);
    if (reason) {
      reasons.push(reason);
    }
  };

  if (answers.moods.length) {
    let total = 0;
    let strongestValue: string | null = null;
    let strongestRatio = 0;
    answers.moods.forEach((value) => {
      const ratio = moodScore(perfume, value, notes);
      total += ratio;
      if (ratio > strongestRatio) {
        strongestRatio = ratio;
        strongestValue = value;
      }
    });
    const achieved = total / answers.moods.length;
    const reason = strongestValue && strongestRatio >= 0.55
      ? `${TEXT.reasonMood}: ${LABEL_LOOKUP[strongestValue]}`
      : undefined;
    addComponent("moods", WEIGHTS.moods, achieved, reason);
  }

  if (answers.moments.length) {
    let total = 0;
    let strongestValue: string | null = null;
    let strongestRatio = 0;
    answers.moments.forEach((value) => {
      const ratio = momentScore(perfume, value, perfumeIntensity, notes);
      total += ratio;
      if (ratio > strongestRatio) {
        strongestRatio = ratio;
        strongestValue = value;
      }
    });
    const achieved = total / answers.moments.length;
    const reason = strongestValue && strongestRatio >= 0.5
      ? `${TEXT.reasonMoment}: ${LABEL_LOOKUP[strongestValue]}`
      : undefined;
    addComponent("moments", WEIGHTS.moments, achieved, reason);
  }

  if (answers.times.length) {
    const ratio = timeScore(perfume, answers.times[0], perfumeIntensity);
    const reason = ratio >= 0.55 ? `${TEXT.reasonTime}: ${LABEL_LOOKUP[answers.times[0]]}` : undefined;
    addComponent("times", WEIGHTS.times, ratio, reason);
  }

  if (answers.intensity.length) {
    const ratio = intensityScore(perfumeIntensity, answers.intensity);
    const reason = ratio >= 0.6 ? `${TEXT.reasonIntensity}: ${LABEL_LOOKUP[answers.intensity[0]]}` : undefined;
    addComponent("intensity", WEIGHTS.intensity, ratio, reason);
  }

  if (answers.styles.length) {
    const ratio = styleScore(perfume, answers.styles);
    const reason = ratio >= 0.7 ? `${TEXT.reasonStyle}: ${LABEL_LOOKUP[answers.styles[0]]}` : undefined;
    addComponent("styles", WEIGHTS.styles, ratio, reason);
  }

  if (answers.noteLikes.length) {
    const noteFeedback = notePreferenceScore(notes, answers.noteLikes);
    const reason = noteFeedback.best
      ? `${TEXT.reasonNotes}: ${LABEL_LOOKUP[noteFeedback.best]}`
      : undefined;
    addComponent("notes", WEIGHTS.notes, noteFeedback.score, reason);
  }

  if (dislikeHits > 0) {
    const severity = Math.min(dislikeHits / 3, 1);
    addPenalty(PENALTY_WEIGHTS.dislikes, severity, TEXT.penaltyDislikes);
  }

  const maxScore = components.reduce((sum, item) => sum + item.weight, 0);
  if (maxScore === 0) {
    return {
      ...perfume,
      score: 0,
      maxScore: 0,
      matchPercentage: 0,
      reasons: [],
    };
  }

  const coreComponents = components.filter((item) =>
    ["moods", "moments", "times", "intensity", "styles"].includes(item.id)
  );

  const strongCoverage = coreComponents.length
    ? coreComponents.filter((item) => item.achieved >= 0.55).length / coreComponents.length
    : 0;

  if (coreComponents.length >= 3 && strongCoverage >= 0.66) {
    addComponent("synergy", WEIGHTS.synergy, 1, TEXT.synergy);
  }

  if (coreComponents.length > 0 && strongCoverage < 0.4) {
    addPenalty(
      PENALTY_WEIGHTS.weakCoverage,
      1 - strongCoverage,
      TEXT.weakCoverage
    );
  }

  const positiveScore = components.reduce(
    (sum, item) => sum + item.weight * item.achieved,
    0
  );
  const rawScore = Math.max(0, positiveScore - penaltyScore);
  const matchPercentage = Math.max(0, Math.min(100, Math.round((rawScore / maxScore) * 100)));
  const distinctReasons = Array.from(new Set(reasons)).slice(0, 4);

  return { ...perfume, score: rawScore, maxScore, matchPercentage, reasons: distinctReasons };
};

 type CompactMode = "normal" | "tight" | "ultra";

 const CARD_IMAGE_HEIGHT: Record<CompactMode, string> = {
   normal: "min(26vh, 180px)",
   tight: "min(22vh, 150px)",
   ultra: "min(18vh, 120px)",
 };

 const CARD_BADGE_LIMIT: Record<CompactMode, number> = {
   normal: 3,
   tight: 2,
   ultra: 1,
 };

 const CARD_REASON_LIMIT: Record<CompactMode, number> = {
   normal: 2,
   tight: 1,
   ultra: 0,
 };

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
     .filter((value): value is string => !!value && value.trim().length > 0)
     .join(" • ");

   const imageHeight = CARD_IMAGE_HEIGHT[compact];
   const badgeLimit = CARD_BADGE_LIMIT[compact];
   const reasonLimit = CARD_REASON_LIMIT[compact];

   const badges = [perfume.family, perfume.character, perfume.season, perfume.gender]
     .filter((value): value is string => !!value && value.trim().length > 0)
     .slice(0, badgeLimit);

   const reasons = reasonLimit > 0 ? perfume.reasons.slice(0, reasonLimit) : [];

   const articleRef = React.useRef<HTMLDivElement>(null);
   const emitRipple = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
     const node = articleRef.current;
     if (!node) return;
     const rect = node.getBoundingClientRect();
     const ripple = (TouchRipple as unknown as { emit?: (x: number, y: number) => void }).emit;
     ripple?.(event.clientX - rect.left, event.clientY - rect.top);
   }, []);

   return (
     <article
       ref={articleRef}
       role="button"
       tabIndex={0}
       onPointerDown={emitRipple}
       aria-label={`${title ?? ""} - درصد تطابق ${perfume.matchPercentage}`}
       className="interactive-card glass-card relative flex h-full flex-col justify-between rounded-2xl p-4 text-right animate-fade-in-up tap-highlight touch-target"
     >
       <TouchRipple />
       <header className="flex items-start justify-between">
         <span className="rounded-full bg-soft px-3 py-1 text-xs font-semibold text-muted">{order}</span>
         <span className="text-sm font-semibold text-[var(--color-accent)]">{perfume.matchPercentage}%</span>
       </header>

       {perfume.image && (
         <div className="flex-grow flex justify-center my-2">
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

       {badges.length > 0 && (
         <div className="flex flex-wrap justify-end gap-2 text-[10px] sm:text-xs text-muted">
           {badges.map((badge, index) => (
             <span key={index} className="badge-soft">
               {badge}
             </span>
           ))}
         </div>
       )}

       {reasons.length > 0 && (
         <ul className="mt-3 space-y-1 text-[11px] sm:text-xs text-muted">
           {reasons.map((reason, index) => (
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
   const [recommendations, setRecommendations] = useState<RankedPerfume[]>([]);
   const [loading, setLoading] = useState(true);
   const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);
   const [compact, setCompact] = useState<CompactMode>("normal");

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

   useEffect(() => {
     async function generate() {
       try {
         const answersParam = searchParams.get("answers");
         if (!answersParam) {
           setLoading(false);
           return;
         }
         const userAnswers = JSON.parse(answersParam) as QuestionnaireAnswers;
         setAnswers(userAnswers);
         const allPerfumes = await getPerfumes();
         const ranked = allPerfumes
           .map((perfume) => computeScore(perfume, userAnswers))
           .filter((item): item is RankedPerfume => item !== null)
           .sort((a, b) => b.matchPercentage - a.matchPercentage || b.score - a.score)
           .slice(0, 6)
           .map((item) => ({
             ...item,
             matchPercentage: Math.min(100, Math.max(0, item.matchPercentage)),
           }));
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
         <div className="relative z-10 loader-orbit" role="status" aria-label={TEXT.loading} />
       </div>
     );
   }

   if (!answers) {
     return (
       <div className="relative flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
         <AnimatedBackground />
         <div className="relative z-10 bg-white/10 backdrop-blur-[32px] border border-white/20 rounded-3xl p-8">
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
       <div className="relative flex h-[92vh] w-full max-w-[1400px] flex-col gap-6 rounded-3xl glass-deep px-6 py-6 shadow-2xl animate-blur-in">
         <header className="flex items-center justify-between animate-slide-in-right">
           <h1 className="text-3xl font-semibold text-[var(--color-foreground)]">{TEXT.heading}</h1>
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
               {TEXT.empty}
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
           <div className="relative z-10 loader-orbit" role="status" aria-label={TEXT.loading} />
         </div>
       }
     >
       <RecommendationsContent />
     </Suspense>
   );
 }
