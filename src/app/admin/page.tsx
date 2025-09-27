"use client";

import Link from "next/link";

const quickLinks = [
  {
    href: "/admin/products",
    title: "مدیریت محصولات",
    description: "افزودن عطر جدید، به‌روزرسانی اطلاعات و مدیریت نت‌ها.",
  },
  {
    href: "/admin/brands",
    title: "مدیریت برندها",
    description: "ساخت برند جدید یا ویرایش برندهای موجود.",
  },
  {
    href: "/admin/collections",
    title: "مدیریت کالکشن‌ها",
    description: "تعریف کالکشن‌های تازه و دسته‌بندی محصولات.",
  },
];

export default function AdminDashboardPage() {
  return (
    <section className="flex flex-col gap-10" dir="rtl">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold">داشبورد مدیریتی</h2>
        <p className="text-[var(--color-foreground-muted)]">
          خوش آمدید! از اینجا می‌توانید محتوای وب‌سایت و کیوسک را به‌صورت یکپارچه مدیریت کنید.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {quickLinks.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background-soft)]/80 p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-strong)]"
          >
            <div className="flex h-full flex-col gap-3">
              <h3 className="text-xl font-semibold text-[var(--color-foreground)] transition-colors group-hover:text-[var(--color-accent-strong)]">
                {card.title}
              </h3>
              <p className="text-sm text-[var(--color-foreground-muted)]">{card.description}</p>
              <span className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent-strong)]">
                ورود به صفحه <span aria-hidden>↗</span>
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-background-soft)]/60 p-6 text-sm text-[var(--color-foreground-muted)]">
        <p className="font-medium text-[var(--color-foreground)]">راهنمای سریع</p>
        <ul className="mt-3 list-disc space-y-2 pr-5">
          <li>برای ثبت عطر جدید ابتدا مطمئن شوید برند و کالکشن آن در سامانه وجود دارد.</li>
          <li>پس از هر بار ثبت یا ویرایش، چند ثانیه صبر کنید تا لیست‌ها به‌روزرسانی شوند.</li>
          <li>در صورت بروز خطا، اتصال به اینترنت و توکن دسترسی را بررسی کنید.</li>
        </ul>
      </div>
    </section>
  );
}
