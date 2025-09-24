"use client";
import Image from "next/image";
import Link from "next/link";
import TapIndicator from "@/components/TapIndicator";
import KioskFrame from "@/components/KioskFrame";

const BULLETS = [
  "۷ پرسش کوتاه بر اساس سلیقه و موقعیت شما",
  "مرور پاسخ‌ها و ویرایش آن‌ها قبل از دیدن نتیجه",
  "پیشنهادهای شخصی‌سازی‌شده با توضیح دلیل تطابق",
];

export default function HomePage() {
  return (
    <KioskFrame>
      <div className="relative flex h-full w-full items-center justify-center px-4">
        <div className="relative flex w-full max-w-5xl flex-col gap-10 rounded-3xl border border-white/20 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-[40px] animate-blur-in sm:p-12 lg:flex-row lg:items-center lg:gap-14 lg:text-right">
          <div className="mx-auto flex w-full max-w-sm justify-center lg:order-2 lg:max-w-none">
            <Image
              src="/logo.webp"
              alt="لوگوی فروشگاه"
              width={520}
              height={520}
              priority
              className="rounded-2xl animate-scale-in"
            />
          </div>

          <div className="flex flex-1 flex-col items-center gap-6 text-center lg:items-end lg:text-right">
            <div className="space-y-3 animate-fade-in-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold text-[var(--color-accent)]">
                رایحه‌ای متناسب با شخصیت شما
              </span>
              <h1 className="text-3xl font-semibold text-[var(--color-foreground)] sm:text-4xl">
                پرسشنامه عطر را در سه دقیقه تکمیل کنید
              </h1>
              <p className="m-0 max-w-xl text-sm text-muted sm:text-base">
                پاسخ به چند پرسش ساده درباره حال‌وهوا، موقعیت استفاده و نُت‌های مورد علاقه، ما را به پیشنهادهای دقیق‌تر می‌رساند.
                در پایان می‌توانید پیش از مشاهده نتیجه، همه پاسخ‌ها را بازبینی و اصلاح کنید.
              </p>
            </div>

            <ul className="w-full space-y-2 text-sm text-muted animate-fade-in-up animate-delay-1">
              {BULLETS.map((item, index) => (
                <li key={index} className="flex items-center justify-center gap-2 lg:justify-end">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-[var(--color-accent)]">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="relative flex flex-col items-center gap-2 animate-fade-in-up animate-delay-2 lg:items-end">
              <Link
                href="/questionnaire"
                className="btn tap-highlight touch-target touch-feedback z-10 px-10 py-5 text-lg font-medium"
              >
                شروع پرسشنامه
              </Link>
              <span className="text-xs text-muted">میانگین زمان تکمیل کمتر از سه دقیقه است.</span>
              <TapIndicator
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-fade-in animate-delay-4 lg:left-auto lg:right-6"
                size={200}
              />
            </div>
          </div>
        </div>
      </div>
    </KioskFrame>
  );
}

