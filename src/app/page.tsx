"use client";
import Image from "next/image";
import Link from "next/link";
import TapIndicator from "@/components/TapIndicator";
import KioskFrame from "@/components/KioskFrame";

export default function HomePage() {
  return (
    <KioskFrame>
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="glass-card relative flex w-full max-w-lg flex-col items-center gap-8 sm:max-w-2xl lg:max-w-3xl sm:gap-10 lg:gap-12 rounded-[32px] p-8 sm:p-12 lg:p-16 text-center animate-blur-in">
          <div className="animate-scale-in">
            <Image
              src="/logo.webp"
              alt="لوگوی فروشگاه"
              width={600}
              height={600}
              priority
              className="rounded-2xl animate-blur-in animate-delay-1"
            />
          </div>

          <div className="flex flex-col items-center gap-4 text-center animate-fade-in-up animate-delay-2">
            <h1 className="m-0 text-3xl font-semibold sm:text-4xl lg:text-[2.9rem]">
              امضای عطری شما، یک لمس فاصله دارد
            </h1>
            <p className="m-0 max-w-xl text-sm text-muted sm:text-base">
              پرسشنامه را کامل کنید تا مجموعه‌ای از عطرهای منتخب ویژه سلیقه‌تان را ببینید.
            </p>
          </div>

          <div className="relative animate-fade-in-up animate-delay-3">
            <Link
              href="/questionnaire"
              className="btn tap-highlight touch-target touch-feedback z-10 px-8 py-5 text-lg font-medium sm:px-10 sm:py-6 lg:px-12"
            >
              شروع پرسشنامه
            </Link>
            <TapIndicator
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-fade-in animate-delay-4"
              size={180}
            />
          </div>
        </div>
      </div>
    </KioskFrame>
  );
}

