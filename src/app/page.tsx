"use client";
import Image from "next/image";
import Link from "next/link";
import TapIndicator from "@/components/TapIndicator";
import KioskFrame from "@/components/KioskFrame";

export default function HomePage() {
  return (
    <KioskFrame>
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="relative flex flex-col items-center gap-8 sm:gap-10 lg:gap-12 text-center bg-white/10 backdrop-blur-[40px] border border-white/20 rounded-3xl p-8 sm:p-12 lg:p-16 w-full max-w-lg sm:max-w-2xl lg:max-w-4xl shadow-2xl animate-blur-in">
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

          <div className="relative animate-fade-in-up animate-delay-3">
            <Link
              href="/questionnaire"
              className="btn tap-highlight touch-target touch-feedback z-10 px-8 sm:px-10 lg:px-12 py-5 sm:py-6 text-lg sm:text-xl font-medium"
            >
              شروع پرسشنامه
            </Link>
            <TapIndicator
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-fade-in animate-delay-4"
              size={200}
            />
          </div>
        </div>
      </div>
    </KioskFrame>
  );
}

