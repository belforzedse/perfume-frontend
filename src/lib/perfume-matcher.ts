import { Perfume } from "@/lib/api";
import { LABEL_LOOKUP, NOTE_CHOICES } from "@/lib/kiosk-options";
import { QuestionnaireAnswers } from "@/lib/questionnaire";

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

type LayerKey = "top" | "middle" | "base";

const LAYER_WEIGHTS: Record<LayerKey, number> = {
  top: 0.4,
  middle: 0.35,
  base: 0.25,
};

const SCORE_WEIGHTS = {
  moods: 28,
  moments: 18,
  times: 10,
  intensity: 12,
  styles: 8,
  noteAffinity: 14,
  noteLayering: 6,
  synergy: 8,
  versatility: 4,
} as const;

const MOOD_PROFILES: Record<
  string,
  { families: string[]; characters: string[]; notes: string[]; keywords?: string[] }
> = {
  fresh: {
    families: ["fresh", "citrus", "aquatic", "green", "aromatic"],
    characters: ["fresh", "cool", "clean", "energetic", "marine", "crisp"],
    notes: [...(NOTE_KEYWORDS.citrus ?? []), ...(NOTE_KEYWORDS.green ?? [])],
    keywords: ["ocean", "marine", "herbal"],
  },
  sweet: {
    families: ["gourmand", "sweet", "oriental"],
    characters: ["sweet", "gourmand", "creamy", "dessert"],
    notes: [...(NOTE_KEYWORDS.sweet ?? [])],
    keywords: ["vanilla", "caramel"],
  },
  warm: {
    families: ["spicy", "oriental", "amber"],
    characters: ["warm", "spicy", "amber", "sensual"],
    notes: [...(NOTE_KEYWORDS.spicy ?? []), ...(NOTE_KEYWORDS.oriental ?? [])],
    keywords: ["leather", "resin"],
  },
  floral: {
    families: ["floral", "powdery"],
    characters: ["floral", "soft", "romantic", "powdery"],
    notes: [...(NOTE_KEYWORDS.floral ?? []), ...(NOTE_KEYWORDS.musky ?? [])],
    keywords: ["petal", "bouquet"],
  },
  woody: {
    families: ["woody", "chypre", "mossy"],
    characters: ["wood", "earthy", "classic", "smoky"],
    notes: [...(NOTE_KEYWORDS.woody ?? []), "patchouli", "leather"],
    keywords: ["forest", "earth"],
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

interface PerfumeAnalysis {
  family: string;
  character: string;
  season: string;
  gender: string;
  intensity: "light" | "medium" | "strong";
  notes: Record<LayerKey | "all", string[]>;
  descriptor: string;
}

interface ScoreComponent {
  key:
    | "moods"
    | "moments"
    | "times"
    | "intensity"
    | "styles"
    | "noteAffinity"
    | "noteLayering"
    | "synergy"
    | "versatility";
  label: string;
  weight: number;
  achieved: number;
  reason?: string;
  isCore?: boolean;
}

interface MultiScoreResult {
  average: number;
  bestLabel?: string;
  bestValue?: string;
  strongMatches: number;
}

interface NoteEvaluation {
  affinity: number;
  layered: number;
  coverage: number;
  best: { value: string; score: number; layers: number } | null;
}

export interface RankedPerfume extends Perfume {
  score: number;
  maxScore: number;
  matchPercentage: number;
  reasons: string[];
  breakdown: ScoreComponent[];
  matchedCorePreferences: number;
  consideredCorePreferences: number;
  confidence: number;
}

const normalize = (value?: string | null) => value?.toLowerCase().trim() ?? "";

const includesAny = (target: string, keywords: string[]) =>
  keywords.some((keyword) => target.includes(keyword));

const mapSeason = (season?: string) => {
  const normalized = normalize(season);
  if (normalized.includes("warm")) return "warm";
  if (normalized.includes("cold")) return "cold";
  if (normalized.includes("cool")) return "cool";
  if (normalized.length === 0) return "all";
  return normalized;
};

const deriveIntensity = (perfume: Perfume): "light" | "medium" | "strong" => {
  const descriptor = `${perfume.character ?? ""} ${perfume.family ?? ""}`.toLowerCase();
  if (STRONG_KEYWORDS.some((keyword) => descriptor.includes(keyword))) return "strong";
  if (LIGHT_KEYWORDS.some((keyword) => descriptor.includes(keyword))) return "light";
  const noteCount = perfume.allNotes.length;
  if (noteCount >= 9) return "strong";
  if (noteCount <= 4) return "light";
  return "medium";
};

const analysePerfume = (perfume: Perfume): PerfumeAnalysis => {
  const notes = {
    top: perfume.notes.top.map((note) => note.toLowerCase()),
    middle: perfume.notes.middle.map((note) => note.toLowerCase()),
    base: perfume.notes.base.map((note) => note.toLowerCase()),
  };

  return {
    family: normalize(perfume.family),
    character: normalize(perfume.character),
    season: mapSeason(perfume.season),
    gender: normalize(perfume.gender),
    intensity: deriveIntensity(perfume),
    notes: {
      ...notes,
      all: perfume.allNotes.map((note) => note.toLowerCase()),
    },
    descriptor: `${normalize(perfume.family)} ${normalize(perfume.character)}`.trim(),
  };
};

const evaluateMoods = (
  analysis: PerfumeAnalysis,
  values: string[]
): MultiScoreResult => {
  if (values.length === 0) return { average: 0, strongMatches: 0 };

  let sum = 0;
  let strongMatches = 0;
  let bestValue: string | undefined;
  let bestRatio = 0;

  values.forEach((value) => {
    const profile = MOOD_PROFILES[value];
    if (!profile) return;
    let score = 0;
    if (includesAny(analysis.family, profile.families)) score += 0.45;
    if (includesAny(analysis.character, profile.characters)) score += 0.35;
    if (profile.keywords && includesAny(analysis.descriptor, profile.keywords)) score += 0.1;
    if (profile.notes && profile.notes.length > 0) {
      const noteMatch = profile.notes.some((keyword) =>
        analysis.notes.all.some((note) => note.includes(keyword))
      );
      if (noteMatch) score += 0.25;
    }
    score = Math.min(score, 1);
    sum += score;
    if (score >= 0.6) strongMatches += 1;
    if (!bestValue || score > bestRatio) {
      bestValue = value;
      bestRatio = score;
    }
  });

  let bestLabel: string | undefined;
  if (bestValue && bestRatio >= 0.55) {
    bestLabel = LABEL_LOOKUP[bestValue];
  }

  return {
    average: sum / values.length,
    bestLabel,
    bestValue,
    strongMatches,
  };
};

const evaluateMoments = (
  analysis: PerfumeAnalysis,
  values: string[]
): MultiScoreResult => {
  if (values.length === 0) return { average: 0, strongMatches: 0 };

  let sum = 0;
  let strongMatches = 0;
  let bestValue: string | undefined;
  let bestRatio = 0;

  values.forEach((value) => {
    const profile = MOMENT_PROFILES[value];
    if (!profile) return;

    const seasonMatch = profile.seasons?.includes(analysis.season) ? 0.4 : 0;
    const intensityMatch = profile.intensity?.includes(analysis.intensity) ? 0.3 : 0;
    const characterMatch =
      profile.characters && includesAny(analysis.character, profile.characters) ? 0.2 : 0;
    const noteMatch = profile.notes?.some((keyword) =>
      analysis.notes.all.some((note) => note.includes(keyword))
    )
      ? 0.1
      : 0;

    const score = seasonMatch + intensityMatch + characterMatch + noteMatch;
    sum += score;
    if (score >= 0.55) strongMatches += 1;
    if (!bestValue || score > bestRatio) {
      bestValue = value;
      bestRatio = score;
    }
  });

  let bestLabel: string | undefined;
  if (bestValue && bestRatio >= 0.55) {
    bestLabel = LABEL_LOOKUP[bestValue];
  }

  return {
    average: sum / values.length,
    bestLabel,
    bestValue,
    strongMatches,
  };
};

const evaluateTime = (
  analysis: PerfumeAnalysis,
  values: string[]
): MultiScoreResult => {
  if (values.length === 0) return { average: 0, strongMatches: 0 };
  const value = values[0];
  const profile = TIME_PROFILES[value];
  if (!profile) return { average: 0, strongMatches: 0 };

  const charMatch = includesAny(analysis.character, profile.characters) ? 0.6 : 0;
  const intensityMatch = profile.intensity?.includes(analysis.intensity) ? 0.4 : 0;
  const score = charMatch + intensityMatch;

  return {
    average: score,
    bestLabel: score >= 0.55 ? LABEL_LOOKUP[value] : undefined,
    bestValue: value,
    strongMatches: score >= 0.6 ? 1 : 0,
  };
};

const evaluateIntensity = (
  perfumeIntensity: string,
  desired: string[]
): MultiScoreResult => {
  if (desired.length === 0) return { average: 0, strongMatches: 0 };
  const wanted = desired[0];
  let score = 0;
  if (wanted === perfumeIntensity) score = 1;
  else if (wanted === "medium" || perfumeIntensity === "medium") score = 0.65;
  else score = 0.25;

  return {
    average: score,
    bestLabel: score >= 0.6 ? LABEL_LOOKUP[wanted] : undefined,
    bestValue: wanted,
    strongMatches: score >= 0.6 ? 1 : 0,
  };
};

const evaluateStyle = (
  analysis: PerfumeAnalysis,
  styles: string[]
): MultiScoreResult => {
  if (styles.length === 0) return { average: 0, strongMatches: 0 };
  const preferred = STYLE_MAP[styles[0]] ?? STYLE_MAP.any;
  const match = preferred.includes(analysis.gender) ? 1 : analysis.gender ? 0.35 : 0.5;
  return {
    average: match,
    bestLabel: match >= 0.7 ? LABEL_LOOKUP[styles[0]] : undefined,
    bestValue: styles[0],
    strongMatches: match >= 0.6 ? 1 : 0,
  };
};

const evaluateNotes = (
  notes: PerfumeAnalysis["notes"],
  desired: string[]
): NoteEvaluation => {
  if (desired.length === 0)
    return { affinity: 0, layered: 0, coverage: 0, best: null };

  let totalAffinity = 0;
  let totalLayering = 0;
  let totalCoverage = 0;
  let best: { value: string; score: number; layers: number } | null = null;

  desired.forEach((value) => {
    const keywords = NOTE_KEYWORDS[value] ?? [];
    if (keywords.length === 0) return;
    let affinityContribution = 0;
    let layeringContribution = 0;
    let layersHit = 0;
    let coverageHit = 0;

    (Object.keys(LAYER_WEIGHTS) as LayerKey[]).forEach((layer) => {
      const layerNotes = notes[layer];
      const hits = keywords.filter((keyword) =>
        layerNotes.some((note) => note.includes(keyword))
      );
      if (hits.length > 0) {
        const coverageRatio = hits.length / keywords.length;
        const weight = LAYER_WEIGHTS[layer];
        affinityContribution += Math.min(1, coverageRatio * 1.2) * weight;
        layeringContribution += weight;
        layersHit += 1;
        coverageHit = 1;
      }
    });

    const overallHits = keywords.filter((keyword) =>
      notes.all.some((note) => note.includes(keyword))
    ).length;
    if (overallHits > 0) {
      affinityContribution += Math.min(1, overallHits / keywords.length) * 0.25;
    }

    if (layersHit > 1) {
      layeringContribution += 0.15;
    }

    const affinityScore = Math.min(1, affinityContribution);
    const layeringScore = Math.min(1, layeringContribution);

    totalAffinity += affinityScore;
    totalLayering += layeringScore;
    totalCoverage += coverageHit;

    if (!best || affinityScore > best.score) {
      best = { value, score: affinityScore, layers: layersHit };
    }
  });

  const answered = desired.length;
  return {
    affinity: totalAffinity / answered,
    layered: totalLayering / answered,
    coverage: totalCoverage / answered,
    best,
  };
};

const hasDislikedNotes = (notes: string[], dislikes: string[]) =>
  dislikes.some((value) => {
    const keywords = NOTE_KEYWORDS[value] ?? [];
    return keywords.some((keyword) => notes.some((note) => note.includes(keyword)));
  });

const clampPercentage = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const computePotentialWeight = (answers: QuestionnaireAnswers) => {
  let weight = 0;
  if (answers.moods.length) weight += SCORE_WEIGHTS.moods;
  if (answers.moments.length) weight += SCORE_WEIGHTS.moments;
  if (answers.times.length) weight += SCORE_WEIGHTS.times;
  if (answers.intensity.length) weight += SCORE_WEIGHTS.intensity;
  if (answers.styles.length) weight += SCORE_WEIGHTS.styles;
  if (answers.noteLikes.length) weight += SCORE_WEIGHTS.noteAffinity;
  if (answers.noteLikes.length > 1) weight += SCORE_WEIGHTS.noteLayering;
  return weight;
};

const dedupeReasons = (reasons: string[]) => Array.from(new Set(reasons.filter(Boolean)));

export const scorePerfume = (
  perfume: Perfume,
  answers: QuestionnaireAnswers
): RankedPerfume | null => {
  const analysis = analysePerfume(perfume);
  if (hasDislikedNotes(analysis.notes.all, answers.noteDislikes)) {
    return null;
  }

  const components: ScoreComponent[] = [];
  const collectedReasons: string[] = [];

  const pushComponent = (component: ScoreComponent, threshold = 0.55) => {
    components.push(component);
    if (component.reason && component.achieved >= threshold) {
      collectedReasons.push(component.reason);
    }
  };

  const moodResult = evaluateMoods(analysis, answers.moods);
  if (answers.moods.length) {
    pushComponent(
      {
        key: "moods",
        label: "حال‌وهوا",
        weight: SCORE_WEIGHTS.moods,
        achieved: moodResult.average,
        reason: moodResult.bestLabel ? `حال‌وهوا: ${moodResult.bestLabel}` : undefined,
        isCore: true,
      },
      0.58
    );
  }

  const momentResult = evaluateMoments(analysis, answers.moments);
  if (answers.moments.length) {
    pushComponent(
      {
        key: "moments",
        label: "موقعیت",
        weight: SCORE_WEIGHTS.moments,
        achieved: momentResult.average,
        reason: momentResult.bestLabel ? `موقعیت: ${momentResult.bestLabel}` : undefined,
        isCore: true,
      },
      0.55
    );
  }

  const timeResult = evaluateTime(analysis, answers.times);
  if (answers.times.length) {
    pushComponent(
      {
        key: "times",
        label: "زمان",
        weight: SCORE_WEIGHTS.times,
        achieved: timeResult.average,
        reason: timeResult.bestLabel ? `زمان: ${timeResult.bestLabel}` : undefined,
        isCore: true,
      },
      0.55
    );
  }

  const intensityResult = evaluateIntensity(analysis.intensity, answers.intensity);
  if (answers.intensity.length) {
    pushComponent(
      {
        key: "intensity",
        label: "شدت",
        weight: SCORE_WEIGHTS.intensity,
        achieved: intensityResult.average,
        reason: intensityResult.bestLabel ? `شدت: ${intensityResult.bestLabel}` : undefined,
        isCore: true,
      },
      0.6
    );
  }

  const styleResult = evaluateStyle(analysis, answers.styles);
  if (answers.styles.length) {
    pushComponent(
      {
        key: "styles",
        label: "سبک",
        weight: SCORE_WEIGHTS.styles,
        achieved: styleResult.average,
        reason: styleResult.bestLabel ? `سبک: ${styleResult.bestLabel}` : undefined,
        isCore: true,
      },
      0.65
    );
  }

  const noteEvaluation = evaluateNotes(analysis.notes, answers.noteLikes);
  if (answers.noteLikes.length) {
    pushComponent(
      {
        key: "noteAffinity",
        label: "نُت‌های محبوب",
        weight: SCORE_WEIGHTS.noteAffinity,
        achieved: noteEvaluation.affinity,
        reason: noteEvaluation.best
          ? `یادداشت محبوب: ${LABEL_LOOKUP[noteEvaluation.best.value]}`
          : undefined,
      },
      0.55
    );
  }

  if (answers.noteLikes.length > 1) {
    pushComponent(
      {
        key: "noteLayering",
        label: "لایه‌بندی نُت‌ها",
        weight: SCORE_WEIGHTS.noteLayering,
        achieved: noteEvaluation.layered,
        reason:
          noteEvaluation.best && noteEvaluation.best.layers > 1
            ? `پراکندگی نُت ${LABEL_LOOKUP[noteEvaluation.best.value]} در چند لایه`
            : undefined,
      },
      0.5
    );
  }

  const maxScore = components.reduce((sum, component) => sum + component.weight, 0);
  if (maxScore === 0) {
    return {
      ...perfume,
      score: 0,
      maxScore: 0,
      matchPercentage: 0,
      reasons: [],
      breakdown: components,
      matchedCorePreferences: 0,
      consideredCorePreferences: 0,
      confidence: 0,
    };
  }

  const coreComponents = components.filter((component) => component.isCore);
  const matchedCore = coreComponents.filter((component) => component.achieved >= 0.6).length;

  if (matchedCore >= 3) {
    pushComponent(
      {
        key: "synergy",
        label: "هماهنگی",
        weight: SCORE_WEIGHTS.synergy,
        achieved: 1,
        reason: "هماهنگی خوب بین ترجیحات شما",
      },
      0.5
    );
  }

  const varietyTargets =
    (answers.moods.length > 1 ? 1 : 0) + (answers.moments.length > 1 ? 1 : 0);
  if (varietyTargets > 0) {
    const coverage =
      (answers.moods.length > 1
        ? Math.min(1, moodResult.strongMatches / answers.moods.length)
        : 0) +
      (answers.moments.length > 1
        ? Math.min(1, momentResult.strongMatches / answers.moments.length)
        : 0);
    const achieved = coverage / varietyTargets;
    if (achieved > 0) {
      pushComponent(
        {
          key: "versatility",
          label: "گسترهٔ کاربرد",
          weight: SCORE_WEIGHTS.versatility,
          achieved,
          reason:
            achieved >= 0.55 ? "پوشش چند موقعیت مورد علاقهٔ شما" : undefined,
        },
        0.55
      );
    }
  }

  const score = components.reduce(
    (sum, component) => sum + component.weight * component.achieved,
    0
  );

  const matchPercentage = clampPercentage((score / maxScore) * 100);

  const potentialWeight = computePotentialWeight(answers);
  const coreWeight = components
    .filter((component) => component.key !== "synergy" && component.key !== "versatility")
    .reduce((sum, component) => sum + component.weight, 0);
  const confidence = potentialWeight
    ? clampPercentage((coreWeight / potentialWeight) * 100)
    : 0;

  const reasons = dedupeReasons(collectedReasons);

  return {
    ...perfume,
    score,
    maxScore,
    matchPercentage,
    reasons,
    breakdown: components,
    matchedCorePreferences: matchedCore,
    consideredCorePreferences: coreComponents.length,
    confidence,
  };
};

export const rankPerfumes = (
  perfumes: Perfume[],
  answers: QuestionnaireAnswers
): RankedPerfume[] =>
  perfumes
    .map((perfume) => scorePerfume(perfume, answers))
    .filter((item): item is RankedPerfume => item !== null)
    .sort(
      (a, b) =>
        b.matchPercentage - a.matchPercentage ||
        b.score - a.score ||
        b.confidence - a.confidence
    );
