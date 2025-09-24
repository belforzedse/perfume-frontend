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

export interface QuestionDefinition {
  title: string;
  description?: string;
  type: QuestionType;
  options: Choice[];
  key: keyof QuestionnaireAnswers;
  optional?: boolean;
  maxSelections?: number;
}

export const TEXT = {
  progressPrefix: "سوال",
  progressOf: "از",
  optional: "اختیاری",
  requiredHint: "برای ادامه لطفاً یک گزینه را انتخاب کنید.",
  back: "بازگشت",
  next: "بعدی",
  finish: "مشاهده پیشنهادات",
  noOptions: "موردی در دسترس نیست.",
  summaryHeading: "گزینه‌های انتخابی",
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
      title: "به کدام دسته از نُت‌ها علاقه دارید؟",
      description: "اختیاری؛ تا سه مورد.",
    },
    dislikes: {
      title: "از کدام دسته از نُت‌ها خوشتان نمی‌آید؟",
      description: "اختیاری؛ تا سه مورد.",
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
  },
  {
    key: "noteDislikes",
    type: "multiple",
    options: NOTE_CHOICES,
    title: TEXT.questions.dislikes.title,
    description: TEXT.questions.dislikes.description,
    optional: true,
    maxSelections: 3,
  },
];

export const SUMMARY_PREVIEW_LIMIT = 4;

export const initialAnswers = (): QuestionnaireAnswers => ({
  moods: [],
  moments: [],
  times: [],
  intensity: [],
  styles: [],
  noteLikes: [],
  noteDislikes: [],
});

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

  const unique = <T extends string>(items: T[]): T[] => {
    const seen = new Set<T>();
    const ordered: T[] = [];
    items.forEach((item) => {
      if (!seen.has(item)) {
        ordered.push(item);
        seen.add(item);
      }
    });
    return ordered;
  };

  for (const question of QUESTION_CONFIG) {
    const raw = input[question.key];
    if (!Array.isArray(raw)) {
      continue;
    }

    const optionValues = new Set(question.options.map((option) => option.value));
    const cleaned = unique(
      raw
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0 && optionValues.has(value))
    );

    if (question.type === "single") {
      base[question.key] = cleaned.slice(0, 1);
      continue;
    }

    if (typeof question.maxSelections === "number") {
      base[question.key] = cleaned.slice(0, question.maxSelections);
    } else {
      base[question.key] = cleaned;
    }
  }

  return base;
};

export const areAnswersEqual = (
  a: QuestionnaireAnswers,
  b: QuestionnaireAnswers
) => {
  return (
    QUESTION_CONFIG.every((question) => {
      const key = question.key;
      const left = a[key];
      const right = b[key];
      return (
        left.length === right.length &&
        left.every((value, index) => value === right[index])
      );
    })
  );
};

export const firstIncompleteStep = (answers: QuestionnaireAnswers) => {
  const index = QUESTION_CONFIG.findIndex((question) => {
    const selected = answers[question.key];
    return !question.optional && selected.length === 0;
  });
  return index === -1 ? 0 : index;
};
