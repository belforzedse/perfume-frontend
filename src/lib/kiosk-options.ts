export interface Choice {
  value: string;
  label: string;
  icon?: string;
}

export interface NoteChoice extends Choice {
  keywords: string[];
}

export const MOOD_CHOICES: Choice[] = [
  { value: "fresh", label: "خنک و تازه", icon: "🥒" },
  { value: "sweet", label: "شیرین و خوراکی", icon: "🍯" },
  { value: "warm", label: "گرم و تند", icon: "🔥" },
  { value: "floral", label: "گلی و لطیف", icon: "🌸" },
  { value: "woody", label: "چوبی و خاکی", icon: "🌲" },
];

export const MOMENT_CHOICES: Choice[] = [
  { value: "daily", label: "روزمره و محل کار", icon: "🗓️" },
  { value: "evening", label: "شب و مهمانی", icon: "🌙" },
  { value: "outdoor", label: "فضای باز و ورزش", icon: "🏞️" },
  { value: "gift", label: "هدیه", icon: "🎁" },
];

export const TIME_CHOICES: Choice[] = [
  { value: "day", label: "روز", icon: "🌞" },
  { value: "night", label: "شب", icon: "🌜" },
  { value: "anytime", label: "هر زمان", icon: "🕒" },
];

export const INTENSITY_CHOICES: Choice[] = [
  { value: "light", label: "ملایم", icon: "🫧" },
  { value: "medium", label: "متوسط", icon: "✨" },
  { value: "strong", label: "قوی", icon: "💥" },
];

export const STYLE_CHOICES: Choice[] = [
  { value: "feminine", label: "زنانه", icon: "👩" },
  { value: "masculine", label: "مردانه", icon: "👨" },
  { value: "unisex", label: "یونیسکس", icon: "⚧️" },
  { value: "any", label: "فرقی ندارد", icon: "⭕" },
];

export const NOTE_CHOICES: NoteChoice[] = [
  {
    value: "citrus",
    label: "مرکباتی",
    icon: "🍊",
    keywords: ["bergamot", "lemon", "orange", "grapefruit", "lime", "citrus", "mandarin"],
  },
  {
    value: "floral",
    label: "گلی",
    icon: "🌸",
    keywords: ["rose", "jasmine", "tuberose", "violet", "peony", "lily"],
  },
  {
    value: "woody",
    label: "چوبی و دودی",
    icon: "🌲",
    keywords: ["cedar", "sandalwood", "vetiver", "oak", "oud", "wood"],
  },
  {
    value: "spicy",
    label: "ادویه‌ای و گرم",
    icon: "🌶️",
    keywords: ["pepper", "cinnamon", "cardamom", "clove", "nutmeg", "spice"],
  },
  {
    value: "sweet",
    label: "شیرین و خوراکی",
    icon: "🍫",
    keywords: ["vanilla", "caramel", "tonka", "honey", "chocolate", "praline"],
  },
  {
    value: "green",
    label: "سبز و گیاهی",
    icon: "🌿",
    keywords: ["mint", "herb", "tea", "basil", "sage", "green"],
  },
  {
    value: "oriental",
    label: "شرقی و کهربایی",
    icon: "🪔",
    keywords: ["amber", "incense", "resin", "labdanum", "benzoin", "oriental"],
  },
  {
    value: "musky",
    label: "مشکی و پودری",
    icon: "🧴",
    keywords: ["musk", "powder", "iris", "heliotrope", "cashmere"],
  },
];

export const LABEL_LOOKUP = Object.fromEntries(
  [
    ...MOOD_CHOICES,
    ...MOMENT_CHOICES,
    ...TIME_CHOICES,
    ...INTENSITY_CHOICES,
    ...STYLE_CHOICES,
    ...NOTE_CHOICES,
  ].map((choice) => [choice.value, choice.label])
);

