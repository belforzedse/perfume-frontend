"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  createCollection,
  fetchCollectionsAdmin,
  type AdminCollection,
  type CreateCollectionPayload,
} from "@/lib/admin-api";

type FeedbackState = {
  type: "success" | "error";
  message: string;
};

interface CollectionFormValues {
  name: string;
}

const defaultValues: CollectionFormValues = {
  name: "",
};

const buildPayload = (values: CollectionFormValues): CreateCollectionPayload => ({
  name: values.name.trim(),
});

export default function AdminCollectionsPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CollectionFormValues>({ defaultValues });
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [status, setStatus] = useState<FeedbackState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const collectionData = await fetchCollectionsAdmin();
      setCollections(collectionData);
    } catch (error) {
      console.error("خطا در بارگذاری کالکشن‌ها", error);
      setStatus({
        type: "error",
        message: "بارگذاری داده‌ها با خطا مواجه شد. لطفاً دوباره تلاش کنید.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onSubmit = async (values: CollectionFormValues) => {
    setStatus(null);

    try {
      const payload = buildPayload(values);
      await createCollection(payload);
      setStatus({ type: "success", message: "کالکشن جدید با موفقیت ثبت شد." });
      reset(defaultValues);
      await loadData();
    } catch (error) {
      console.error("خطا در ثبت کالکشن", error);
      setStatus({ type: "error", message: "ثبت کالکشن انجام نشد. مجدداً تلاش کنید." });
    }
  };

  return (
    <section className="flex flex-col gap-10" dir="rtl">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold">کالکشن‌ها</h2>
        <p className="text-[var(--color-foreground-muted)]">
          کالکشن‌های برندهای مختلف را مدیریت کنید و دسته‌بندی‌های تازه بسازید.
        </p>
      </div>

      <form
        className="space-y-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background-soft)]/70 p-6 shadow-[var(--shadow-soft)]"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="name">
            نام کالکشن <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] focus:border-[var(--color-accent)] focus:outline-none"
            placeholder="مثلاً Private Blend"
            {...register("name", { required: "نام کالکشن الزامی است." })}
          />
          {errors.name && (
            <span className="text-xs text-red-500">{errors.name.message}</span>
          )}
        </div>

        {status && (
          <div
            className={`rounded-[var(--radius-base)] px-4 py-3 text-sm ${
              status.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {status.message}
          </div>
        )}

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-[var(--radius-base)] bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "در حال ارسال..." : "ثبت کالکشن"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">لیست کالکشن‌های موجود</h3>
          {loading && <span className="text-sm text-[var(--color-foreground-muted)]">در حال بارگذاری...</span>}
        </div>
        {collections.length === 0 && !loading ? (
          <p className="text-sm text-[var(--color-foreground-muted)]">هنوز کالکشنی ثبت نشده است.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {collections.map((collection) => (
              <li
                key={collection.id}
                className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-background-soft)]/70 p-4 text-sm shadow-[var(--shadow-soft)]"
              >
                <p className="font-semibold text-[var(--color-foreground)]">{collection.name}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
