import {
  Choice,
  INTENSITY_CHOICES,
  MOMENT_CHOICES,
  MOOD_CHOICES,
  NOTE_CHOICES,
  STYLE_CHOICES,
  TIME_CHOICES,
  LABEL_LOOKUP,
} from "./kiosk-options";

export type QuestionType = "multiple" | "single";

export interface QuestionnaireAnswers {
  moods: string[];
  moments: string[];
  times: string[];
  intensity: string[];
  styles: string[];
  noteLikes: string[];
  noteDislikes: string[];
}

interface BaseQuestionDefinition {
  title: string;
  description?: string;
  type: QuestionType;
  options: Choice[];
  key: keyof QuestionnaireAnswers;
  optional?: boolean;
  maxSelections?: number;
  variant?: "standard";
}

export interface NotePreferenceQuestionDefinition
  extends Omit<BaseQuestionDefinition, "variant" | "type"> {
  type: "multiple";
  pairedKey: keyof QuestionnaireAnswers;
  maxDislikes?: number;
  variant: "notePreference";
}

export type QuestionDefinition = BaseQuestionDefinition | NotePreferenceQuestionDefinition;

export const isNotePreferenceQuestion = (
  question: QuestionDefinition
): question is NotePreferenceQuestionDefinition => question.variant === "notePreference";

export const TEXT = {
  progressPrefix: "سوال",
  progressOf: "از",
  optional: "اختیاری",
  requiredHint: "برای ادامه لطفاً یک گزینه را انتخاب کنید.",
  back: "بازگشت",
  next: "بعدی",
  finish: "مشاهده پیشنهادات",
  review: {
    title: "بازبینی پاسخ‌ها",
    description: "پیش از دیدن پیشنهادها، پاسخ هر سوال را بررسی یا اصلاح کنید.",
    helper: "برای تغییر پاسخ، گزینهٔ ویرایش را انتخاب کنید.",
    confirm: "مشاهده پیشنهادها",
    empty: "پاسخی ثبت نشده است.",
  },
  noOptions: "موردی در دسترس نیست.",
  summaryHeading: "گزینه‌های انتخابی",
  clearStep: "پاک کردن این مرحله",
  restart: "شروع دوباره",
  close: "بستن",
  separator: "، ",
  summaryLabels: {
    moods: "حال‌وهوا",
    moments: "موقعیت",
    times: "زمان",
    intensity: "شدت",
    styles: "سبک",
    likes: "نُت‌های محبوب",
    dislikes: "نُت‌های نامطلوب",
  },
  notePreferences: {
    like: "دوست دارم",
    dislike: "اجتناب",
    neutral: "خنثی",
    neutralDescription: "اگر مطمئن نیستید، خنثی را انتخاب کنید.",
  },
  settings: {
    autoAdvance: "پیشروی خودکار پس از انتخاب گزینهٔ تکی",
  },
  questions: {
    moods: {
      title: "حال‌وهواهای مورد علاقه شما چیست؟",
      description: "حداکثر دو مورد را انتخاب کنید.",
    },
    moments: {
      title: "این عطر را بیشتر برای چه موقعیت‌هایی می‌خواهید؟",
      description: "حداکثر سه مورد را انتخاب کنید.",
    },
    times: {
      title: "بیشتر برای چه زمانی از روز؟",
    },
    intensity: {
      title: "شدت پخش بو را ترجیح می‌دهید؟",
      description: "از ملایم تا قوی.",
    },
    styles: {
      title: "سبک عطر مورد علاقه شما چیست؟",
    },
    likes: {
      title: "ترجیحات خود درباره نُت‌ها را مشخص کنید",
      description: "می‌توانید برای هر گروه نُت مشخص کنید آن را دوست دارید یا باید از آن دوری شود.",
    },
  },
};

export const QUESTION_CONFIG: QuestionDefinition[] = [
  {
    key: "moods",
    type: "multiple",
    options: MOOD_CHOICES,
    title: TEXT.questions.moods.title,
    description: TEXT.questions.moods.description,
    maxSelections: 2,
  },
  {
    key: "moments",
    type: "multiple",
    options: MOMENT_CHOICES,
    title: TEXT.questions.moments.title,
    description: TEXT.questions.moments.description,
    maxSelections: 3,
  },
  {
    key: "times",
    type: "single",
    options: TIME_CHOICES,
    title: TEXT.questions.times.title,
  },
  {
    key: "intensity",
    type: "single",
    options: INTENSITY_CHOICES,
    title: TEXT.questions.intensity.title,
    description: TEXT.questions.intensity.description,
  },
  {
    key: "styles",
    type: "single",
    options: STYLE_CHOICES,
    title: TEXT.questions.styles.title,
  },
  {
    key: "noteLikes",
    type: "multiple",
    options: NOTE_CHOICES,
    title: TEXT.questions.likes.title,
    description: TEXT.questions.likes.description,
    optional: true,
    maxSelections: 3,
    pairedKey: "noteDislikes",
    maxDislikes: 3,
    variant: "notePreference",
  },
];

export const QUESTION_KEYS: Array<keyof QuestionnaireAnswers> = Array.from(
  new Set(
    QUESTION_CONFIG.flatMap((question) =>
      isNotePreferenceQuestion(question) ? [question.key, question.pairedKey] : [question.key]
    )
  )
);

export const SUMMARY_PREVIEW_LIMIT = 5;

export const initialAnswers = (): QuestionnaireAnswers => ({
  moods: [],
  moments: [],
  times: [],
  intensity: [],
  styles: [],
  noteLikes: [],
  noteDislikes: [],
});

const sanitizeList = (
  value: unknown,
  options: Choice[],
  limit?: number,
  single = false
): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const optionValues = new Set(options.map((option) => option.value));
  const seen = new Set<string>();
  const cleaned: string[] = [];

  value.forEach((item) => {
    if (typeof item !== "string") return;
    const trimmed = item.trim();
    if (!trimmed || !optionValues.has(trimmed) || seen.has(trimmed)) return;
    seen.add(trimmed);
    cleaned.push(trimmed);
  });

  if (single) {
    return cleaned.slice(0, 1);
  }

  if (typeof limit === "number") {
    return cleaned.slice(0, Math.max(limit, 0));
  }

  return cleaned;
};

export const separatorJoin = (values: string[]) =>
  values
    .map((value) => LABEL_LOOKUP[value] ?? value)
    .filter((value) => value.trim().length > 0)
    .join(TEXT.separator);

export const sanitizeAnswers = (
  input: Partial<QuestionnaireAnswers> | null | undefined
): QuestionnaireAnswers => {
  const base = initialAnswers();

  if (!input || typeof input !== "object") {
    return base;
  }

  for (const question of QUESTION_CONFIG) {
    const raw = input[question.key];
    const sanitized = sanitizeList(
      raw,
      question.options,
      question.maxSelections,
      question.type === "single"
    );
    base[question.key] = sanitized;

    if (isNotePreferenceQuestion(question)) {
      const dislikeRaw = input[question.pairedKey];
      const dislikeSanitized = sanitizeList(
        dislikeRaw,
        question.options,
        question.maxDislikes ?? question.maxSelections,
        false
      ).filter((value) => !sanitized.includes(value));
      base[question.pairedKey] = dislikeSanitized;
    }
  }

  return base;
};

export const areAnswersEqual = (
  a: QuestionnaireAnswers,
  b: QuestionnaireAnswers
) => {
  return QUESTION_KEYS.every((key) => {
    const left = a[key];
    const right = b[key];
    return left.length === right.length && left.every((value, index) => value === right[index]);
  });
};

export const firstIncompleteStep = (answers: QuestionnaireAnswers) => {
  const index = QUESTION_CONFIG.findIndex((question) => {
    if (question.optional) return false;
    const selected = answers[question.key];
    return selected.length === 0;
  });
  return index === -1 ? 0 : index;
};
