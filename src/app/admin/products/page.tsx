"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  createPerfume,
  updatePerfume,
  deletePerfume,
  fetchBrandsAdmin,
  fetchCollectionsAdmin,
  fetchPerfumesAdmin,
  uploadFile,
  type AdminBrand,
  type AdminCollection,
  type AdminPerfume,
  type CreatePerfumePayload,
  type UpdatePerfumePayload,
  type PerfumeNotes,
} from "@/lib/admin-api";

import ImageUpload from "@/components/ImageUpload";

type FeedbackState = {
  type: "success" | "error";
  message: string;
};

interface PerfumeFormValues {
  nameFa: string;
  nameEn: string;
  brandId: string;
  collectionId: string;
  gender: string;
  season: string;
  family: string;
  character: string;
  description?: string;
  notes: PerfumeNotes;
  image?: File | null;
}

const genderOptions = ["زنانه", "مردانه", "یونیسکس"];
const seasonOptions = ["بهار", "تابستان", "پاییز", "زمستان", "چهارفصل"];
const familyOptions = ["گلی", "چوبی", "شرقی", "مرکباتی", "آروماتیک", "مشکدار"];
const characterOptions = ["رسمی", "روزمره", "رمانتیک", "اسپرت", "جذاب", "کلاسیک"];

const createDefaultValues = (): PerfumeFormValues => ({
  nameFa: "",
  nameEn: "",
  brandId: "",
  collectionId: "",
  gender: "",
  season: "",
  family: "",
  character: "",
  description: "",
  notes: {
    top: [],
    middle: [],
    base: [],
  },
  image: null,
});

const normaliseNotes = (items: string[]): string[] =>
  Array.from(
    new Set(
      items
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .map((item) => item.replace(/\s+/g, " ")),
    ),
  );

interface NotesFieldProps {
  label: string;
  helper: string;
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

function NotesField({ label, helper, value, onChange, error }: NotesFieldProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      return;
    }

    if (!value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
  };

  const handleRemove = (note: string) => {
    onChange(value.filter((item) => item !== note));
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[var(--color-foreground)]">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleAdd();
            }
          }}
          className="flex-1 rounded-[var(--radius-base)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] focus:border-[var(--color-accent)] focus:outline-none"
          placeholder="مثلاً ترنج"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-[var(--radius-base)] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[var(--color-accent-strong)]"
        >
          افزودن
        </button>
      </div>
      <p className="text-xs text-[var(--color-foreground-muted)]">{helper}</p>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((note) => (
            <span
              key={note}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs text-[var(--color-accent-contrast)]"
            >
              {note}
              <button
                type="button"
                onClick={() => handleRemove(note)}
                className="text-[var(--color-accent-contrast)]/70 transition hover:text-[var(--color-accent-contrast)]"
                aria-label={`حذف ${note}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

export default function AdminProductsPage() {
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PerfumeFormValues>({ defaultValues: createDefaultValues() });

  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [perfumes, setPerfumes] = useState<AdminPerfume[]>([]);
  const [status, setStatus] = useState<FeedbackState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingPerfume, setEditingPerfume] = useState<AdminPerfume | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [brandData, collectionData, perfumeData] = await Promise.all([
        fetchBrandsAdmin(),
        fetchCollectionsAdmin(),
        fetchPerfumesAdmin(),
      ]);
      setBrands(brandData);
      setCollections(collectionData);
      setPerfumes(perfumeData);
    } catch (error) {
      console.error("خطا در بارگذاری داده‌های محصول", error);
      setStatus({
        type: "error",
        message: "بارگذاری داده‌ها با خطا مواجه شد. دوباره تلاش کنید.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedBrandId = watch("brandId");
  const selectedCollectionId = watch("collectionId");

  const availableCollections = useMemo(() => {
    if (!selectedBrandId) {
      return collections;
    }

    return collections.filter((collection) =>
      collection.brand ? collection.brand.id.toString() === selectedBrandId : false,
    );
  }, [collections, selectedBrandId]);

  useEffect(() => {
    if (!selectedCollectionId) {
      return;
    }

    const exists = availableCollections.some(
      (collection) => collection.id.toString() === selectedCollectionId,
    );

    if (!exists) {
      setValue("collectionId", "");
    }
  }, [availableCollections, selectedCollectionId, setValue]);

  const handleEdit = useCallback((perfume: AdminPerfume) => {
    setEditingPerfume(perfume);
    setIsEditing(true);

    // Populate form with existing data
    reset({
      nameFa: perfume.name_fa,
      nameEn: perfume.name_en,
      brandId: perfume.brand?.id.toString() || "",
      collectionId: perfume.collection?.id.toString() || "",
      gender: perfume.gender || "",
      season: perfume.season || "",
      family: perfume.family || "",
      character: perfume.character || "",
      description: perfume.description || "",
      notes: perfume.notes,
      image: null, // Don't populate image field when editing (user must upload a new file to change it)
    });
  }, [reset]);

  const handleCancelEdit = useCallback(() => {
    setEditingPerfume(null);
    setIsEditing(false);
    reset(createDefaultValues());
    setStatus(null);
  }, [reset]);

  const handleDelete = useCallback(async (perfume: AdminPerfume) => {
    if (!confirm(`آیا مطمئن هستید که می‌خواهید عطر "${perfume.name_fa}" را حذف کنید؟`)) {
      return;
    }

    try {
      await deletePerfume(perfume.id);
      setStatus({ type: "success", message: "محصول با موفقیت حذف شد." });
      await loadData();
    } catch (error) {
      console.error("خطا در حذف محصول", error);
      setStatus({
        type: "error",
        message: "حذف محصول با خطا مواجه شد. دوباره تلاش کنید.",
      });
    }
  }, [loadData]);

  const onSubmit = async (values: PerfumeFormValues) => {
    setStatus(null);

    try {
      let coverId: number | undefined;

      // Upload image if provided and it's a File (not existing URL)
      if (values.image && values.image instanceof File) {
        try {
          const uploadResult = await uploadFile(values.image);
          coverId = uploadResult.id;
        } catch (uploadError) {
          console.error("خطا در آپلود تصویر", uploadError);
          setStatus({
            type: "error",
            message: "آپلود تصویر با خطا مواجه شد. لطفاً دوباره تلاش کنید.",
          });
          return;
        }
      }

      const payload: CreatePerfumePayload | UpdatePerfumePayload = {
        name_fa: values.nameFa.trim(),
        name_en: values.nameEn.trim(),
        description: values.description?.trim() || undefined,
        gender: values.gender || undefined,
        season: values.season || undefined,
        family: values.family || undefined,
        character: values.character || undefined,
        notes: {
          top: normaliseNotes(values.notes.top),
          middle: normaliseNotes(values.notes.middle),
          base: normaliseNotes(values.notes.base),
        },
        brand: Number(values.brandId),
        collection: values.collectionId ? Number(values.collectionId) : undefined,
        cover: coverId,
      };

      if (isEditing && editingPerfume) {
        await updatePerfume(editingPerfume.id, payload);
        setStatus({ type: "success", message: "محصول با موفقیت به‌روزرسانی شد." });
        handleCancelEdit();
      } else {
        await createPerfume(payload);
        setStatus({ type: "success", message: "محصول جدید با موفقیت ثبت شد." });
        reset(createDefaultValues());
      }

      await loadData();
    } catch (error) {
      console.error("خطا در ثبت/ویرایش محصول", error);
      setStatus({
        type: "error",
        message: isEditing
          ? "ویرایش محصول با خطا مواجه شد. مقادیر فرم را بررسی و مجدداً تلاش کنید."
          : "ثبت محصول با خطا مواجه شد. مقادیر فرم را بررسی و مجدداً تلاش کنید.",
      });
    }
  };

  return (
    <section className="flex flex-col gap-10" dir="rtl">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold">
          {isEditing ? `ویرایش عطر: ${editingPerfume?.name_fa}` : "محصولات / عطرها"}
        </h2>
        <p className="text-[var(--color-foreground-muted)]">
          {isEditing
            ? "اطلاعات عطر را ویرایش کنید و تغییرات را ذخیره نمایید."
            : "اطلاعات کامل عطرهای فروشگاه را وارد کنید و ارتباط آن‌ها را با برند و کالکشن مشخص نمایید."}
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
              placeholder="مثلاً افسانه شرقی"
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
              placeholder="مثلاً Oriental Tale"
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
              برند مرتبط <span className="text-red-500">*</span>
            </label>
            <select
              id="brandId"
              className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] focus:border-[var(--color-accent)] focus:outline-none"
              {...register("brandId", { required: "انتخاب برند الزامی است." })}
            >
              <option value="">یک برند را انتخاب کنید</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            {errors.brandId && (
              <span className="text-xs text-red-500">{errors.brandId.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="collectionId">
              کالکشن مرتبط
            </label>
            <select
              id="collectionId"
              className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] focus:border-[var(--color-accent)] focus:outline-none"
              {...register("collectionId")}
            >
              <option value="">انتخاب نشده</option>
              {availableCollections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
            {selectedBrandId && availableCollections.length === 0 && (
              <span className="text-xs text-[var(--color-foreground-muted)]">
                برای این برند کالکشنی ثبت نشده است.
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="gender">
              جنسیت هدف
            </label>
            <select
              id="gender"
              className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] focus:border-[var(--color-accent)] focus:outline-none"
              {...register("gender")}
            >
              <option value="">انتخاب نشده</option>
              {genderOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="season">
              فصل پیشنهادی
            </label>
            <select
              id="season"
              className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] focus:border-[var(--color-accent)] focus:outline-none"
              {...register("season")}
            >
              <option value="">انتخاب نشده</option>
              {seasonOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="family">
              خانواده عطری
            </label>
            <select
              id="family"
              className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] focus:border-[var(--color-accent)] focus:outline-none"
              {...register("family")}
            >
              <option value="">انتخاب نشده</option>
              {familyOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="character">
              کاراکتر / حس کلی
            </label>
            <select
              id="character"
              className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] focus:border-[var(--color-accent)] focus:outline-none"
              {...register("character")}
            >
              <option value="">انتخاب نشده</option>
              {characterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="description">
              توضیحات تکمیلی
            </label>
            <textarea
              id="description"
              className="min-h-[140px] rounded-[var(--radius-base)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] focus:border-[var(--color-accent)] focus:outline-none"
              placeholder="توضیحات و نکات برجسته محصول را بنویسید..."
              {...register("description")}
            />
          </div>

          <Controller
            control={control}
            name="image"
            render={({ field, fieldState }) => (
              <ImageUpload
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                label="تصویر محصول"
                accept="image/*"
                maxSize={5}
              />
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Controller
            control={control}
            name="notes.top"
            rules={{ validate: (value) => value.length > 0 || "حداقل یک نت بالایی وارد کنید." }}
            render={({ field, fieldState }) => (
              <NotesField
                label="نت‌های آغازین"
                helper="نام نت را تایپ کرده و دکمه افزودن را بزنید."
                value={field.value ?? []}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="notes.middle"
            rules={{ validate: (value) => value.length > 0 || "حداقل یک نت میانی وارد کنید." }}
            render={({ field, fieldState }) => (
              <NotesField
                label="نت‌های میانی"
                helper="برای جداکردن نت‌ها از دکمه افزودن استفاده کنید."
                value={field.value ?? []}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="notes.base"
            rules={{ validate: (value) => value.length > 0 || "حداقل یک نت پایانی وارد کنید." }}
            render={({ field, fieldState }) => (
              <NotesField
                label="نت‌های پایانی"
                helper="می‌توانید هر تعداد نت که می‌خواهید اضافه کنید."
                value={field.value ?? []}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
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

        <div className="flex items-center justify-end gap-3">
          {isEditing && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="inline-flex items-center justify-center rounded-[var(--radius-base)] border border-[var(--color-border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-foreground)] transition-all hover:bg-[var(--color-background-soft)]"
            >
              انصراف
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-[var(--radius-base)] bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting
              ? "در حال ارسال..."
              : isEditing
                ? "ذخیره تغییرات"
                : "ثبت محصول"
            }
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">آخرین محصولات ثبت‌شده</h3>
          {loading && <span className="text-sm text-[var(--color-foreground-muted)]">در حال بارگذاری...</span>}
        </div>
        {perfumes.length === 0 && !loading ? (
          <p className="text-sm text-[var(--color-foreground-muted)]">هنوز محصولی ثبت نشده است.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {perfumes.map((perfume) => (
              <li
                key={perfume.id}
                className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-background-soft)]/70 p-4 text-sm shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {perfume.image && (
                      <img
                        src={perfume.image}
                        alt={perfume.name_fa}
                        className="h-16 w-16 rounded-[var(--radius-base)] object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-[var(--color-foreground)]">{perfume.name_fa}</p>
                      <p className="text-xs text-[var(--color-foreground-subtle)]">{perfume.name_en}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-[var(--color-foreground-muted)]">
                      {perfume.brand && <p>برند: {perfume.brand.name}</p>}
                      {perfume.collection && <p>کالکشن: {perfume.collection.name}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(perfume)}
                        className="rounded px-3 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
                        title="ویرایش"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(perfume)}
                        className="rounded px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                        title="حذف"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-[var(--color-foreground-muted)]">
                  <p>
                    جنسیت: {perfume.gender ?? "---"} | فصل: {perfume.season ?? "---"}
                  </p>
                  <p>
                    خانواده: {perfume.family ?? "---"} | کاراکتر: {perfume.character ?? "---"}
                  </p>
                  <div className="space-y-1">
                    <p className="font-medium text-[var(--color-foreground)]">نت‌ها</p>
                    <div className="grid gap-1 md:grid-cols-3">
                      <div>
                        <p className="text-[var(--color-foreground)]">آغازی</p>
                        <p>{perfume.notes.top.join("، ") || "---"}</p>
                      </div>
                      <div>
                        <p className="text-[var(--color-foreground)]">میانی</p>
                        <p>{perfume.notes.middle.join("، ") || "---"}</p>
                      </div>
                      <div>
                        <p className="text-[var(--color-foreground)]">پایانی</p>
                        <p>{perfume.notes.base.join("، ") || "---"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
