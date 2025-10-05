"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  createBrand,
  fetchBrandsAdmin,
  type AdminBrand,
  type CreateBrandPayload,
} from "@/lib/admin-api";

type FeedbackState = {
  type: "success" | "error";
  message: string;
};

interface BrandFormValues {
  name: string;
}

const defaultValues: BrandFormValues = {
  name: "",
};

const buildPayload = (values: BrandFormValues): CreateBrandPayload => ({
  name: values.name.trim(),
});

export default function AdminBrandsPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BrandFormValues>({ defaultValues });
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [status, setStatus] = useState<FeedbackState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const loadBrands = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBrandsAdmin();
      setBrands(data);
    } catch (error) {
      console.error("خطا در بارگذاری برندها", error);
      setStatus({
        type: "error",
        message: "بارگذاری برندها با خطا مواجه شد. اتصال و توکن را بررسی کنید.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBrands();
  }, [loadBrands]);

  const onSubmit = async (values: BrandFormValues) => {
    setStatus(null);

    try {
      const payload = buildPayload(values);
      await createBrand(payload);
      setStatus({ type: "success", message: "برند جدید با موفقیت ثبت شد." });
      reset(defaultValues);
      await loadBrands();
    } catch (error) {
      console.error("خطا در ثبت برند", error);
      setStatus({ type: "error", message: "ثبت برند انجام نشد. لطفاً دوباره تلاش کنید." });
    }
  };

  return (
    <section className="flex flex-col gap-10" dir="rtl">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold">برندها</h2>
        <p className="text-[var(--color-foreground-muted)]">
          لیست برندهای موجود را مشاهده کنید و برند تازه‌ای به سامانه اضافه نمایید.
        </p>
      </div>

      <form
        className="space-y-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background-soft)]/70 p-6 shadow-[var(--shadow-soft)]"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="name">
            نام برند <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] focus:border-[var(--color-accent)] focus:outline-none"
            placeholder="مثلاً شنل"
            {...register("name", { required: "نام برند الزامی است." })}
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

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-[var(--radius-base)] bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "در حال ارسال..." : "ثبت برند"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">لیست برندهای موجود</h3>
          {loading && <span className="text-sm text-[var(--color-foreground-muted)]">در حال بارگذاری...</span>}
        </div>
        {brands.length === 0 && !loading ? (
          <p className="text-sm text-[var(--color-foreground-muted)]">هنوز برندی ثبت نشده است.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {brands.map((brand) => (
              <li
                key={brand.id}
                className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-background-soft)]/70 p-4 text-sm shadow-[var(--shadow-soft)]"
              >
                <p className="font-semibold text-[var(--color-foreground)]">{brand.name}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
