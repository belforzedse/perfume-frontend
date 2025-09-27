"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  createCollection,
  fetchBrandsAdmin,
  fetchCollectionsAdmin,
  type AdminBrand,
  type AdminCollection,
  type CreateCollectionPayload,
} from "@/lib/admin-api";

type FeedbackState = {
  type: "success" | "error";
  message: string;
};

interface CollectionFormValues {
  nameFa: string;
  nameEn: string;
  brandId?: string;
  description?: string;
  slug?: string;
}

const defaultValues: CollectionFormValues = {
  nameFa: "",
  nameEn: "",
  brandId: "",
  description: "",
  slug: "",
};

const buildPayload = (values: CollectionFormValues): CreateCollectionPayload => ({
  name_fa: values.nameFa.trim(),
  name_en: values.nameEn.trim(),
  description: values.description?.trim() || undefined,
  slug: values.slug?.trim() || undefined,
  brand: values.brandId ? Number(values.brandId) : undefined,
});

export default function AdminCollectionsPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CollectionFormValues>({ defaultValues });
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [status, setStatus] = useState<FeedbackState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [brandData, collectionData] = await Promise.all([
        fetchBrandsAdmin(),
        fetchCollectionsAdmin(),
      ]);
      setBrands(brandData);
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
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="nameFa">
              نام فارسی <span className="text-red-500">*</span>
            </label>
            <input
              id="nameFa"
              type="text"
              className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] focus:border-[var(--color-accent)] focus:outline-none"
              placeholder="مثلاً کالکشن اختصاصی"
              {...register("nameFa", { required: "نام فارسی الزامی است." })}
            />
            {errors.nameFa && (
              <span className="text-xs text-red-500">{errors.nameFa.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="nameEn">
              نام انگلیسی <span className="text-red-500">*</span>
            </label>
            <input
              id="nameEn"
              type="text"
              className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] focus:border-[var(--color-accent)] focus:outline-none"
              placeholder="مثلاً Exclusive Collection"
              {...register("nameEn", { required: "نام انگلیسی الزامی است." })}
            />
            {errors.nameEn && (
              <span className="text-xs text-red-500">{errors.nameEn.message}</span>
            )}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="brandId">
              برند مرتبط
            </label>
            <select
              id="brandId"
              className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] focus:border-[var(--color-accent)] focus:outline-none"
              {...register("brandId")}
            >
              <option value="">انتخاب نشده</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name_fa} ({brand.name_en})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="slug">
              اسلاگ (اختیاری)
            </label>
            <input
              id="slug"
              type="text"
              className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] focus:border-[var(--color-accent)] focus:outline-none"
              placeholder="مثلاً exclusive"
              {...register("slug")}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="description">
            توضیحات (اختیاری)
          </label>
          <textarea
            id="description"
            className="min-h-[120px] rounded-[var(--radius-base)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] focus:border-[var(--color-accent)] focus:outline-none"
            placeholder="توضیحات یا جزئیات کالکشن را درج کنید..."
            {...register("description")}
          />
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
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[var(--color-foreground)]">{collection.name_fa}</p>
                  <span className="text-xs text-[var(--color-foreground-subtle)]">{collection.name_en}</span>
                </div>
                {collection.brand && (
                  <p className="mt-1 text-xs text-[var(--color-foreground-muted)]">
                    برند: {collection.brand.name_fa} ({collection.brand.name_en})
                  </p>
                )}
                {collection.description && (
                  <p className="mt-2 text-[var(--color-foreground-muted)] leading-relaxed">{collection.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
