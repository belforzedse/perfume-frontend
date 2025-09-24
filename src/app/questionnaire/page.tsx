"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import KioskFrame from "@/components/KioskFrame";
import NavigationControls from "@/components/questionnaire/NavigationControls";
import NotePreferenceGrid, {
  type NotePreferenceValue,
} from "@/components/questionnaire/NotePreferenceGrid";
import OptionGrid from "@/components/questionnaire/OptionGrid";
import ProgressPanel from "@/components/questionnaire/ProgressPanel";
import ReviewStep from "@/components/questionnaire/ReviewStep";
import { toPersianNumbers } from "@/lib/api";
import {
  TEXT,
  QUESTION_CONFIG,
  SUMMARY_PREVIEW_LIMIT,
  type QuestionnaireAnswers,
  initialAnswers,
  separatorJoin,
  sanitizeAnswers,
  areAnswersEqual,
  firstIncompleteStep,
  isNotePreferenceQuestion,
  QUESTION_KEYS,
} from "@/lib/questionnaire";

const ANSWER_STORAGE_KEY = "perfume-quiz-answers-v2";
const SETTINGS_STORAGE_KEY = "perfume-quiz-settings-v1";

interface QuestionnaireSettings {
  autoAdvanceSingle: boolean;
}

const DEFAULT_SETTINGS: QuestionnaireSettings = {
  autoAdvanceSingle: false,
};

const readStoredAnswers = (): QuestionnaireAnswers | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(ANSWER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<QuestionnaireAnswers>;
    return sanitizeAnswers(parsed);
  } catch (error) {
    console.warn("Unable to read stored answers", error);
    return null;
  }
};

const readStoredSettings = (): QuestionnaireSettings => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.sessionStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<QuestionnaireSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    console.warn("Unable to read stored settings", error);
    return DEFAULT_SETTINGS;
  }
};

const Questionnaire: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const answersFromQuery = useMemo(() => {
    const param = searchParams.get("answers");
    if (!param) return null;
    try {
      const parsed = JSON.parse(param) as Partial<QuestionnaireAnswers>;
      return sanitizeAnswers(parsed);
    } catch (error) {
      console.warn("Invalid answers provided in query", error);
      return null;
    }
  }, [searchParams]);

  const storedAnswers = useMemo(() => readStoredAnswers(), []);
  const initialState = answersFromQuery ?? storedAnswers ?? initialAnswers();
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(initialState);
  const initialStepIndex = answersFromQuery
    ? firstIncompleteStep(answersFromQuery)
    : storedAnswers
      ? firstIncompleteStep(storedAnswers)
      : 0;
  const [currentStep, setCurrentStep] = useState(initialStepIndex);
  const [isReview, setIsReview] = useState(false);
  const [settings, setSettings] = useState<QuestionnaireSettings>(() => readStoredSettings());

  useEffect(() => {
    if (!answersFromQuery) return;
    setAnswers((prev) => (areAnswersEqual(prev, answersFromQuery) ? prev : answersFromQuery));
    setCurrentStep(firstIncompleteStep(answersFromQuery));
    setIsReview(false);
  }, [answersFromQuery]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn("Failed to persist settings", error);
    }
  }, [settings]);

  const questions = QUESTION_CONFIG;
  const totalSteps = questions.length;
  const sanitizedAnswers = useMemo(() => sanitizeAnswers(answers), [answers]);
  const encodedAnswers = useMemo(() => JSON.stringify(sanitizedAnswers), [sanitizedAnswers]);

  const searchParamsString = useMemo(() => searchParams.toString(), [searchParams]);
  const requestedStep = useMemo(() => {
    const value = searchParams.get("step");
    if (!value) return null;
    if (value === "review") return "review" as const;
    if (/^\d+$/.test(value)) {
      const index = Number(value);
      if (!Number.isNaN(index)) {
        return Math.min(Math.max(index, 0), totalSteps - 1);
      }
    }
    const targetIndex = questions.findIndex((question) => question.key === value);
    return targetIndex >= 0 ? targetIndex : null;
  }, [questions, searchParams, totalSteps]);

  useEffect(() => {
    if (requestedStep === null) return;
    if (requestedStep === "review") {
      setIsReview(true);
      return;
    }
    setIsReview(false);
    setCurrentStep((prev) => (prev === requestedStep ? prev : requestedStep));
  }, [requestedStep]);

  const hasAnswers = useMemo(
    () => QUESTION_KEYS.some((key) => sanitizedAnswers[key].length > 0),
    [sanitizedAnswers]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (hasAnswers) {
        window.sessionStorage.setItem(ANSWER_STORAGE_KEY, encodedAnswers);
      } else {
        window.sessionStorage.removeItem(ANSWER_STORAGE_KEY);
      }
    } catch (error) {
      console.warn("Failed to persist answers", error);
    }
  }, [encodedAnswers, hasAnswers]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (hasAnswers) {
      nextParams.set("answers", encodedAnswers);
    }
    if (isReview) {
      nextParams.set("step", "review");
    } else if (currentStep > 0) {
      nextParams.set("step", String(currentStep));
    }
    const nextString = nextParams.toString();
    if (nextString === searchParamsString) return;
    const path = nextString.length ? `/questionnaire?${nextString}` : "/questionnaire";
    router.replace(path, { scroll: false });
  }, [encodedAnswers, hasAnswers, isReview, currentStep, router, searchParamsString]);

  const currentQuestion = !isReview ? questions[currentStep] : null;
  const isNoteStep = currentQuestion ? isNotePreferenceQuestion(currentQuestion) : false;
  const selectedValues = currentQuestion ? sanitizedAnswers[currentQuestion.key] : [];
  const selectedCount = selectedValues.length;

  const goNext = useCallback(() => {
    if (isReview) {
      const query = new URLSearchParams({ answers: JSON.stringify(sanitizedAnswers) }).toString();
      router.push(`/recommendations?${query}`);
      return;
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep((step) => Math.min(step + 1, totalSteps - 1));
      return;
    }

    setIsReview(true);
  }, [currentStep, isReview, router, sanitizedAnswers, totalSteps]);

  const goBack = useCallback(() => {
    if (isReview) {
      setIsReview(false);
      setCurrentStep(totalSteps - 1);
      return;
    }
    setCurrentStep((step) => Math.max(step - 1, 0));
  }, [isReview, totalSteps]);

  const noteQuestionDefinition = useMemo(
    () => questions.find((question) => isNotePreferenceQuestion(question)),
    [questions]
  );

  const noteLikeLimit = noteQuestionDefinition?.maxSelections ?? Number.POSITIVE_INFINITY;
  const noteDislikeLimit = noteQuestionDefinition?.maxDislikes ?? noteLikeLimit;

  const toggle = useCallback(
    (value: string) => {
      if (!currentQuestion || isNotePreferenceQuestion(currentQuestion)) return;
      setAnswers((prev) => {
        const key = currentQuestion.key;
        const selected = prev[key];
        const isSelected = selected.includes(value);
        const atLimit =
          !isSelected &&
          currentQuestion.type === "multiple" &&
          typeof currentQuestion.maxSelections === "number" &&
          selected.length >= currentQuestion.maxSelections;

        if (currentQuestion.type === "single") {
          return { ...prev, [key]: isSelected ? [] : [value] };
        }

        if (atLimit) return prev;
        return {
          ...prev,
          [key]: isSelected ? selected.filter((item) => item !== value) : [...selected, value],
        };
      });
    },
    [currentQuestion]
  );

  const updateNotePreference = useCallback(
    (value: string, preference: NotePreferenceValue) => {
      setAnswers((prev) => {
        const likes = new Set(prev.noteLikes);
        const dislikes = new Set(prev.noteDislikes);
        likes.delete(value);
        dislikes.delete(value);
        if (preference === "like") {
          if (likes.size >= noteLikeLimit && !likes.has(value)) {
            return prev;
          }
          likes.add(value);
        } else if (preference === "dislike") {
          if (dislikes.size >= noteDislikeLimit && !dislikes.has(value)) {
            return prev;
          }
          dislikes.add(value);
        }
        return {
          ...prev,
          noteLikes: Array.from(likes),
          noteDislikes: Array.from(dislikes),
        };
      });
    },
    [noteDislikeLimit, noteLikeLimit]
  );

  const resetCurrent = useCallback(() => {
    if (!currentQuestion) return;
    setAnswers((prev) => {
      if (isNotePreferenceQuestion(currentQuestion)) {
        if (prev.noteLikes.length === 0 && prev.noteDislikes.length === 0) {
          return prev;
        }
        return { ...prev, noteLikes: [], noteDislikes: [] };
      }
      const key = currentQuestion.key;
      if (prev[key].length === 0) return prev;
      return { ...prev, [key]: [] };
    });
  }, [currentQuestion]);

  const resetAll = useCallback(() => {
    setAnswers(initialAnswers());
    setCurrentStep(0);
    setIsReview(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(ANSWER_STORAGE_KEY);
    }
    router.replace("/questionnaire", { scroll: false });
  }, [router]);

  useEffect(() => {
    if (!settings.autoAdvanceSingle) return;
    if (isReview) return;
    const question = currentQuestion;
    if (!question || question.type !== "single") return;
    if (selectedCount === 0) return;
    const timer = window.setTimeout(() => {
      goNext();
    }, 420);
    return () => window.clearTimeout(timer);
  }, [settings.autoAdvanceSingle, isReview, currentQuestion, selectedCount, goNext]);

  const progressPercent = isReview
    ? 100
    : Math.round(((currentStep + 1) / totalSteps) * 100);
  const progressPercentLabel = `${toPersianNumbers(String(progressPercent))}%`;
  const progressLabel = isReview
    ? TEXT.review.title
    : `${TEXT.progressPrefix} ${toPersianNumbers(String(currentStep + 1))} ${TEXT.progressOf} ${toPersianNumbers(String(totalSteps))}`;

  const limitMessage = useMemo(() => {
    if (!currentQuestion || currentQuestion.type !== "multiple" || typeof currentQuestion.maxSelections !== "number") {
      return null;
    }
    const max = currentQuestion.maxSelections;
    const remaining = Math.max(0, max - selectedValues.length);
    const base = `حداکثر ${toPersianNumbers(String(max))} انتخاب`;
    if (remaining === 0) {
      return `${base} تکمیل شد.`;
    }
    if (remaining === max) {
      return `${base} — هنوز انتخابی انجام نشده است.`;
    }
    return `${base} — می‌توانید ${toPersianNumbers(String(remaining))} گزینه دیگر برگزینید.`;
  }, [currentQuestion, selectedValues.length]);

  const stepIndexByKey = useMemo(() => {
    const map = new Map<string, number>();
    questions.forEach((question, index) => {
      map.set(question.key, index);
      if (isNotePreferenceQuestion(question)) {
        map.set(question.pairedKey, index);
      }
    });
    return map;
  }, [questions]);

  const summaryChips = useMemo(() => {
    const chips: Array<{ text: string; stepIndex: number; active: boolean }> = [];
    const maybePush = (text: string, key: keyof QuestionnaireAnswers) => {
      const stepIndex = stepIndexByKey.get(key);
      if (typeof stepIndex !== "number") return;
      chips.push({
        text,
        stepIndex,
        active: !isReview && stepIndex === currentStep,
      });
    };
    if (sanitizedAnswers.moods.length) {
      maybePush(`${TEXT.summaryLabels.moods}: ${separatorJoin(sanitizedAnswers.moods)}`, "moods");
    }
    if (sanitizedAnswers.moments.length) {
      maybePush(`${TEXT.summaryLabels.moments}: ${separatorJoin(sanitizedAnswers.moments)}`, "moments");
    }
    if (sanitizedAnswers.times.length) {
      maybePush(`${TEXT.summaryLabels.times}: ${separatorJoin(sanitizedAnswers.times)}`, "times");
    }
    if (sanitizedAnswers.intensity.length) {
      maybePush(`${TEXT.summaryLabels.intensity}: ${separatorJoin(sanitizedAnswers.intensity)}`, "intensity");
    }
    if (sanitizedAnswers.styles.length) {
      maybePush(`${TEXT.summaryLabels.styles}: ${separatorJoin(sanitizedAnswers.styles)}`, "styles");
    }
    if (sanitizedAnswers.noteLikes.length) {
      maybePush(`${TEXT.summaryLabels.likes}: ${separatorJoin(sanitizedAnswers.noteLikes)}`, "noteLikes");
    }
    if (sanitizedAnswers.noteDislikes.length) {
      maybePush(`${TEXT.summaryLabels.dislikes}: ${separatorJoin(sanitizedAnswers.noteDislikes)}`, "noteDislikes");
    }
    return chips.slice(0, SUMMARY_PREVIEW_LIMIT);
  }, [currentStep, isReview, sanitizedAnswers, stepIndexByKey]);

  const steps = useMemo(() => {
    return questions.map((question, index) => {
      const likes = sanitizedAnswers[question.key];
      const dislikes = isNotePreferenceQuestion(question)
        ? sanitizedAnswers[question.pairedKey]
        : [];
      const hasResponse = likes.length > 0 || dislikes.length > 0;
      let status: "complete" | "current" | "upcoming" = "upcoming";
      if (!isReview) {
        if (index < currentStep) status = "complete";
        else if (index === currentStep) status = "current";
        else status = hasResponse ? "complete" : "upcoming";
      } else {
        status = hasResponse ? "complete" : "upcoming";
      }
      return {
        title: question.title,
        status,
        optional: Boolean(question.optional),
      };
    });
  }, [questions, sanitizedAnswers, isReview, currentStep]);

  const noteHasSelection = sanitizedAnswers.noteLikes.length > 0 || sanitizedAnswers.noteDislikes.length > 0;
  const canProceed = isReview
    ? true
    : currentQuestion
      ? currentQuestion.optional || selectedValues.length > 0 || (isNoteStep && noteHasSelection)
      : false;

  const helperText = isReview
    ? TEXT.review.helper
    : currentQuestion
      ? currentQuestion.optional
        ? TEXT.optional
        : TEXT.requiredHint
      : undefined;

  const autoAdvanceToggle = (
    <button
      type="button"
      role="switch"
      aria-checked={settings.autoAdvanceSingle}
      onClick={() => setSettings((prev) => ({ ...prev, autoAdvanceSingle: !prev.autoAdvanceSingle }))}
      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors tap-highlight touch-target ${
        settings.autoAdvanceSingle
          ? "border-[var(--color-accent)] bg-[var(--accent-soft)] text-[var(--color-accent)]"
          : "border-white/20 bg-white/10 text-muted"
      }`}
    >
      <span
        className={`inline-flex h-4 w-7 items-center rounded-full p-0.5 transition ${
          settings.autoAdvanceSingle ? "justify-end bg-[var(--color-accent)]" : "justify-start bg-white/20"
        }`}
      >
        <span className="h-3 w-3 rounded-full bg-white" />
      </span>
      {TEXT.settings.autoAdvance}
    </button>
  );

  return (
    <KioskFrame>
      <div className="relative flex h-full w-full items-center justify-center px-4 py-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-10 top-12 h-48 w-48 rounded-full bg-amber-200/25 blur-[100px]" />
          <div className="absolute right-10 bottom-16 h-56 w-56 rounded-full bg-white/20 blur-[120px]" />
        </div>
        <div className="relative grid h-full w-full max-w-[1300px] gap-6 rounded-3xl glass-deep px-4 py-6 shadow-2xl animate-blur-in lg:grid-cols-[360px,1fr] lg:px-10 lg:py-8">
          <ProgressPanel
            title={isReview ? TEXT.review.title : currentQuestion?.title ?? TEXT.review.title}
            description={isReview ? TEXT.review.description : currentQuestion?.description}
            progressLabel={progressLabel}
            progressPercent={progressPercent}
            progressPercentLabel={progressPercentLabel}
            summaryHeading={TEXT.summaryHeading}
            summaryChips={summaryChips}
            optional={Boolean(!isReview && currentQuestion?.optional)}
            optionalLabel={TEXT.optional}
            limitMessage={isReview ? null : limitMessage}
            onResetCurrent={isReview ? undefined : resetCurrent}
            onResetAll={resetAll}
            onSelectStep={(stepIndex) => {
              setIsReview(false);
              setCurrentStep(stepIndex);
            }}
            steps={steps}
            settingsSlot={autoAdvanceToggle}
          />

          <div className="relative flex h-full flex-col gap-4">
            <section className="flex flex-1 flex-col gap-6 overflow-y-auto rounded-3xl border border-white/12 bg-white/8 p-5 animate-scale-in animate-delay-2">
              {!isReview && currentQuestion && !isNotePreferenceQuestion(currentQuestion) && (
                <OptionGrid
                  question={currentQuestion}
                  selectedValues={selectedValues}
                  onToggle={toggle}
                  emptyMessage={TEXT.noOptions}
                />
              )}

              {!isReview && currentQuestion && isNotePreferenceQuestion(currentQuestion) && (
                <NotePreferenceGrid
                  options={currentQuestion.options}
                  likes={sanitizedAnswers.noteLikes}
                  dislikes={sanitizedAnswers.noteDislikes}
                  maxLikes={currentQuestion.maxSelections}
                  maxDislikes={currentQuestion.maxDislikes}
                  likeLabel={TEXT.notePreferences.like}
                  dislikeLabel={TEXT.notePreferences.dislike}
                  neutralLabel={TEXT.notePreferences.neutral}
                  neutralDescription={TEXT.notePreferences.neutralDescription}
                  onChange={updateNotePreference}
                />
              )}

              {isReview && (
                <ReviewStep
                  answers={sanitizedAnswers}
                  questions={questions}
                  summaryLabels={TEXT.summaryLabels}
                  emptyLabel={TEXT.review.empty}
                  formatValues={separatorJoin}
                  onEditStep={(index) => {
                    setIsReview(false);
                    setCurrentStep(index);
                  }}
                />
              )}
            </section>

            <div className="lg:sticky lg:bottom-0">
              <NavigationControls
                onBack={goBack}
                onNext={goNext}
                disableBack={isReview ? false : currentStep === 0}
                disableNext={!canProceed}
                backLabel={TEXT.back}
                nextLabel={isReview ? TEXT.review.confirm : currentStep === totalSteps - 1 ? TEXT.finish : TEXT.next}
                helperText={helperText ?? undefined}
                isOptional={Boolean(!isReview && currentQuestion?.optional)}
              />
            </div>
          </div>
        </div>
      </div>
    </KioskFrame>
  );
};

export default Questionnaire;
