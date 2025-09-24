"use client";

export default function AnimatedBackground() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden rounded-[32px]">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50" />
      <div className="absolute -top-32 right-12 h-80 w-80 rounded-full bg-white/30 blur-[120px]" />
      <div className="absolute bottom-0 left-8 h-72 w-72 rounded-full bg-amber-100/30 blur-[120px]" />
      <div className="absolute top-1/3 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-orange-200/20 blur-[120px]" />
    </div>
  );
}
