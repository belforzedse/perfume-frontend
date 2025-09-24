import type { Perfume } from "./api";
import { NOTE_CHOICES } from "./kiosk-options";
import type { QuestionnaireAnswers } from "./questionnaire";

export type MatchIntensity = "light" | "medium" | "strong";

export type MatchReasonCode =
  | "mood"
  | "moment"
  | "time"
  | "intensity"
  | "style"
  | "note"
  | "synergy"
  | "dislikePenalty"
  | "coveragePenalty";

export interface MatchReason {
  code: MatchReasonCode;
  value?: string;
  tone: "positive" | "warning";
}

export interface RankedPerfume extends Perfume {
  score: number;
  maxScore: number;
  matchPercentage: number;
  reasons: MatchReason[];
  intensityLevel: MatchIntensity;
  coverage: number;
}

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
    intensity?: Array<MatchIntensity>;
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
  { characters: string[]; intensity?: Array<MatchIntensity> }
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

const deriveIntensity = (perfume: Perfume): MatchIntensity => {
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
  intensity: MatchIntensity,
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
  intensity: MatchIntensity
) => {
  const profile = TIME_PROFILES[value];
  if (!profile) return 0;
  const charMatch = includesAny(normalize(perfume.character), profile.characters) ? 0.6 : 0;
  const intensityMatch = profile.intensity?.includes(intensity) ? 0.4 : 0;
  return charMatch + intensityMatch;
};

const intensityScore = (perfumeIntensity: MatchIntensity, desired: string[]) => {
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

const dislikedMatches = (notes: string[], dislikes: string[]) =>
  dislikes.reduce((total, value) => {
    const keywords = NOTE_KEYWORDS[value] ?? [];
    const hits = keywords.filter((keyword) => notes.some((note) => note.includes(keyword))).length;
    return total + hits;
  }, 0);

type ComponentId = keyof typeof WEIGHTS | "notes";

const computeScore = (
  perfume: Perfume,
  answers: QuestionnaireAnswers
): RankedPerfume | null => {
  const notes = perfume.allNotes.map((note) => note.toLowerCase());
  const dislikeHits = dislikedMatches(notes, answers.noteDislikes);

  const components: Array<{
    id: ComponentId;
    weight: number;
    achieved: number;
    reason?: MatchReason;
  }> = [];
  let penaltyScore = 0;
  const reasons: MatchReason[] = [];
  const perfumeIntensity = deriveIntensity(perfume);

  const addReason = (reason?: MatchReason, achieved?: number) => {
    if (!reason) return;
    if (reason.tone === "positive" && typeof achieved === "number" && achieved < 0.55) {
      return;
    }
    const key = `${reason.code}:${reason.value ?? ""}`;
    const exists = reasons.some((item) => `${item.code}:${item.value ?? ""}` === key);
    if (!exists) {
      reasons.push(reason);
    }
  };

  const addComponent = (
    id: ComponentId,
    weight: number,
    achieved: number,
    reason?: MatchReason
  ) => {
    components.push({ id, weight, achieved, reason });
    addReason(reason, achieved);
  };

  const addPenalty = (weight: number, severity: number, reason?: MatchReason) => {
    penaltyScore += weight * Math.min(Math.max(severity, 0), 1);
    if (reason) {
      const tagged = { ...reason, tone: "warning" as const };
      const key = `${tagged.code}:${tagged.value ?? ""}`;
      const exists = reasons.some((item) => `${item.code}:${item.value ?? ""}` === key);
      if (!exists) {
        reasons.push(tagged);
      }
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
    const reason =
      strongestValue && strongestRatio >= 0.55
        ? { code: "mood" as const, value: strongestValue, tone: "positive" as const }
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
    const reason =
      strongestValue && strongestRatio >= 0.5
        ? { code: "moment" as const, value: strongestValue, tone: "positive" as const }
        : undefined;
    addComponent("moments", WEIGHTS.moments, achieved, reason);
  }

  if (answers.times.length) {
    const ratio = timeScore(perfume, answers.times[0], perfumeIntensity);
    const reason =
      ratio >= 0.55
        ? { code: "time" as const, value: answers.times[0], tone: "positive" as const }
        : undefined;
    addComponent("times", WEIGHTS.times, ratio, reason);
  }

  if (answers.intensity.length) {
    const ratio = intensityScore(perfumeIntensity, answers.intensity);
    const reason =
      ratio >= 0.6
        ? { code: "intensity" as const, value: answers.intensity[0], tone: "positive" as const }
        : undefined;
    addComponent("intensity", WEIGHTS.intensity, ratio, reason);
  }

  if (answers.styles.length) {
    const ratio = styleScore(perfume, answers.styles);
    const reason =
      ratio >= 0.7
        ? { code: "style" as const, value: answers.styles[0], tone: "positive" as const }
        : undefined;
    addComponent("styles", WEIGHTS.styles, ratio, reason);
  }

  if (answers.noteLikes.length) {
    const noteFeedback = notePreferenceScore(notes, answers.noteLikes);
    const reason = noteFeedback.best
      ? { code: "note" as const, value: noteFeedback.best, tone: "positive" as const }
      : undefined;
    addComponent("notes", WEIGHTS.notes, noteFeedback.score, reason);
  }

  if (dislikeHits > 0) {
    const severity = Math.min(dislikeHits / 3, 1);
    addPenalty(PENALTY_WEIGHTS.dislikes, severity, { code: "dislikePenalty", tone: "warning" });
  }

  const maxScore = components.reduce((sum, item) => sum + item.weight, 0);
  if (maxScore === 0) {
    return {
      ...perfume,
      score: 0,
      maxScore: 0,
      matchPercentage: 0,
      reasons: [],
      intensityLevel: perfumeIntensity,
      coverage: 0,
    };
  }

  const coreComponents = components.filter((item) =>
    ["moods", "moments", "times", "intensity", "styles"].includes(item.id)
  );

  const strongCoverage = coreComponents.length
    ? coreComponents.filter((item) => item.achieved >= 0.55).length / coreComponents.length
    : 0;

  if (coreComponents.length >= 3 && strongCoverage >= 0.66) {
    addComponent("synergy", WEIGHTS.synergy, 1, { code: "synergy", tone: "positive" });
  }

  if (coreComponents.length > 0 && strongCoverage < 0.4) {
    addPenalty(PENALTY_WEIGHTS.weakCoverage, 1 - strongCoverage, {
      code: "coveragePenalty",
      tone: "warning",
    });
  }

  const positiveScore = components.reduce((sum, item) => sum + item.weight * item.achieved, 0);
  const rawScore = Math.max(0, positiveScore - penaltyScore);
  const matchPercentage = Math.max(0, Math.min(100, Math.round((rawScore / maxScore) * 100)));

  return {
    ...perfume,
    score: rawScore,
    maxScore,
    matchPercentage,
    reasons,
    intensityLevel: perfumeIntensity,
    coverage: strongCoverage,
  };
};

export const rankPerfumes = (
  perfumes: Perfume[],
  answers: QuestionnaireAnswers,
  limit = 6
): RankedPerfume[] => {
  return perfumes
    .map((perfume) => computeScore(perfume, answers))
    .filter((item): item is RankedPerfume => item !== null)
    .sort((a, b) => b.matchPercentage - a.matchPercentage || b.score - a.score)
    .slice(0, Math.max(limit, 0));
};

export const describeMatchQuality = (percentage: number) => {
  if (percentage >= 85) return { tone: "great" as const, label: "پیشنهاد عالی" };
  if (percentage >= 65) return { tone: "good" as const, label: "پیشنهاد مناسب" };
  if (percentage >= 45) return { tone: "fair" as const, label: "گزینه قابل بررسی" };
  return { tone: "light" as const, label: "تطابق محدود" };
};

export type MatchQuality = ReturnType<typeof describeMatchQuality>;
