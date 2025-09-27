"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navigationLinks = [
  { href: "/admin/products", label: "محصولات" },
  { href: "/admin/brands", label: "برندها" },
  { href: "/admin/collections", label: "کالکشن‌ها" },
];

export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]" dir="rtl">
      <header className="border-b border-[var(--color-border)]/70 bg-[var(--color-surface)]/90 backdrop-blur-xl shadow-[var(--shadow-soft)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-8">
          <p className="text-sm text-[var(--color-foreground-subtle)]">مدیریت محتوا</p>
          <h1 className="text-3xl font-semibold">پنل مدیریت گندم پرفیوم</h1>
          <p className="text-[var(--color-foreground-muted)]">
            از این بخش می‌توانید محصولات، برندها و کالکشن‌ها را مدیریت کنید.
          </p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:flex-row">
        <nav className="flex flex-row gap-3 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-3 shadow-[var(--shadow-soft)] lg:h-fit lg:w-64 lg:flex-col">
          {navigationLinks.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-[var(--radius-base)] px-4 py-3 text-sm transition-all ${
                  active
                    ? "bg-[var(--color-accent)] text-white shadow-[var(--shadow-strong)]"
                    : "bg-transparent text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                <span>{item.label}</span>
                {active && <span className="text-xs">فعال</span>}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]/95 p-6 shadow-[var(--shadow-soft)] lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
