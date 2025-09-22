"use client";

import { useEffect, useMemo, useState } from "react";
import { getPerfumes, type Perfume } from "@/lib/api";
import Link from "next/link";

const buildHeadline = (perfume: Perfume): string => {
  if (perfume.nameFa && perfume.nameFa.trim().length > 0) {
    return perfume.nameFa;
  }
  return perfume.nameEn;
};

const buildMeta = (perfume: Perfume): string | undefined => {
  const parts = [perfume.brand, perfume.collection]
    .filter((value): value is string => !!value && value.trim().length > 0)
    .map((value) => value.trim());
  if (parts.length === 0) {
    return undefined;
  }
  return parts.join(" • ");
};

const PerfumeSummary = ({ perfume }: { perfume: Perfume }) => {
  const headline = buildHeadline(perfume);
  const meta = buildMeta(perfume);

  return (
    <div className="surface-subtle flex h-full flex-col justify-between rounded-3xl p-4 text-right">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-[var(--color-foreground)]">
          {headline}
        </h3>
        {perfume.nameEn && (
          <p className="m-0 text-xs italic text-subtle">{perfume.nameEn}</p>
        )}
        {meta && <p className="m-0 text-sm text-subtle">{meta}</p>}
      </div>

      <div className="text-xs text-muted">
        <div className="flex flex-wrap justify-end gap-2">
          {perfume.family && (
            <span className="badge-soft">{perfume.family}</span>
          )}
          {perfume.character && (
            <span className="badge-soft">{perfume.character}</span>
          )}
          {perfume.season && <span className="badge-soft">{perfume.season}</span>}
          {perfume.gender && <span className="badge-soft">{perfume.gender}</span>}
        </div>
        {perfume.allNotes.length > 0 && (
          <p className="mt-3 line-clamp-2 text-right text-xs leading-relaxed text-muted">
            نت‌های شاخص: {perfume.allNotes.slice(0, 6).join("، ")}
          </p>
        )}
      </div>
    </div>
  );
};

export default function HomePage() {
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const data = await getPerfumes();
      setPerfumes(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const samplePerfumes = useMemo(() => perfumes.slice(0, 3), [perfumes]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-4">
        <div className="surface-card w-full max-w-sm text-center">
          <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-2 border-dashed border-[var(--color-accent)]" />
          <div className="text-base font-semibold text-muted">
            در حال آماده‌سازی مجموعه عطرها...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-5 px-4 py-6">
        <header className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="surface-card flex flex-col justify-between rounded-3xl p-8 text-right">
            <div className="space-y-4">
              <span className="badge-soft self-start text-sm">گندم پرفیوم</span>
              <h1 className="text-3xl font-bold text-[var(--color-foreground)]">
                انتخاب عطر دلخواه در چند لمس
              </h1>
              <p className="text-sm leading-relaxed text-muted">
                با پاسخ به چند پرسش ساده، عطرهای هماهنگ با فصل، حال‌و‌هوا و برند مورد علاقه‌تان را کشف کنید.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Link href="/questionnaire" className="btn tap-highlight">
                شروع پرسشنامه
              </Link>
              <Link href="/recommendations" className="btn-ghost tap-highlight text-sm">
                مشاهده پیشنهادها
              </Link>
            </div>
          </section>

          <section className="surface-card flex flex-col justify-between rounded-3xl p-8 text-right">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="m-0 text-sm text-muted">عطرهای موجود</p>
                <p className="m-0 text-4xl font-bold text-[var(--color-foreground)]">
                  {perfumes.length}
                </p>
              </div>
              <div className="rounded-3xl bg-[var(--accent-soft)] px-4 py-2 text-xs font-semibold text-[var(--color-accent)]">
                آرشیو در حال رشد
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-muted">
              <div className="rounded-3xl bg-soft px-4 py-3">
                <span className="font-semibold text-[var(--color-foreground)]">۳ گام سریع</span>
                <p className="m-0 mt-1 text-xs">
                  انتخاب خانواده بویایی، فصل و برند محبوب؛ نتیجه دقیق و فوری روی همین صفحه.
                </p>
              </div>
              <div className="rounded-3xl bg-soft px-4 py-3">
                <span className="font-semibold text-[var(--color-foreground)]">بدون نیاز به لمس زیاد</span>
                <p className="m-0 mt-1 text-xs">
                  همه اجزا برای نمایشگر کیوسک تنظیم شده و نیازی به پیمایش عمودی نیست.
                </p>
              </div>
            </div>
          </section>
        </header>

        <section className="grid flex-[1.1] grid-cols-1 gap-5 rounded-3xl bg-transparent lg:grid-cols-3">
          {samplePerfumes.map((perfume) => (
            <PerfumeSummary key={perfume.id} perfume={perfume} />
          ))}

          {samplePerfumes.length === 0 && (
            <div className="surface-card col-span-full flex h-full items-center justify-center rounded-3xl text-sm text-muted">
              هنوز عطری ثبت نشده است؛ لطفاً داده‌ها را در Strapi وارد کنید.
            </div>
          )}
        </section>

        <footer className="surface-card flex items-center justify-between rounded-3xl px-6 py-4 text-sm text-muted">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
              راهنمای سریع
            </span>
            <span>مرحله ۱: پرسشنامه ➜ مرحله ۲: مشاهده پیشنهادها ➜ مرحله ۳: انتخاب نهایی</span>
          </div>
          <div className="hidden gap-3 text-xs font-medium text-[var(--color-foreground)] sm:flex">
            <span>انتحاب آسان</span>
            <span>داده‌های به‌روز</span>
            <span>تجربه کاربری لمسی</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

