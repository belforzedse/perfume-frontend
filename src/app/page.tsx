"use client";

import { useEffect, useState } from "react";
import { getPerfumes, formatToman, type Perfume } from "@/lib/api";
import Link from "next/link";

export default function HomePage() {
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const data = await getPerfumes();
      setPerfumes(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-100 to-purple-100 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">
          در حال بارگذاری عطرها...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 to-purple-100">
      <div className="container mx-auto px-4 py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-800 mb-6">
            عطر مناسب خود را پیدا کنید
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            با پرسشنامه تعاملی ما، عطر ایده‌آل خود را کشف کنید
          </p>
          <Link
            href="/questionnaire"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-all duration-300 transform hover:scale-105"
          >
            شروع پرسشنامه
          </Link>
        </div>

        {/* Perfume Count */}
        <div className="text-center mb-12">
          <p className="text-lg text-gray-600">
            از میان{" "}
            <span className="font-bold text-purple-600">{perfumes.length}</span>{" "}
            عطر منتخب انتخاب کنید
          </p>
        </div>

        {/* Sample Perfumes Grid */}
        {perfumes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {perfumes.slice(0, 6).map((perfume) => (
              <div
                key={perfume.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {perfume.name}
                </h3>
                <p className="text-gray-600 mb-2">{perfume.brand}</p>
                <p className="text-purple-600 font-bold text-lg">
                  {formatToman(perfume.price)}
                </p>
                {perfume.scent_families.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1 justify-end">
                      {perfume.scent_families.map((family, index) => (
                        <span
                          key={index}
                          className="bg-purple-100 text-purple-800 text-sm px-2 py-1 rounded"
                        >
                          {family}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {perfumes.length === 0 && (
          <div className="text-center">
            <div className="bg-yellow-100 border-r-4 border-yellow-500 text-yellow-700 p-4 max-w-md mx-auto rounded">
              <p className="font-bold">هیچ عطری یافت نشد</p>
              <p>لطفاً در پنل مدیریت استرپی چند عطر اضافه کنید!</p>
              <p className="text-sm mt-2">
                ابتدا استرپی را اجرا کنید:{" "}
                <code className="bg-gray-200 px-1">npm run develop</code>
              </p>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            چرا عطریاب؟
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                انتخاب دقیق
              </h3>
              <p className="text-gray-600">
                بر اساس سلیقه و نیاز شما، بهترین عطر را پیشنهاد می‌دهیم
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                سریع و آسان
              </h3>
              <p className="text-gray-600">
                تنها در چند دقیقه عطر مناسب خود را پیدا کنید
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                کیفیت برتر
              </h3>
              <p className="text-gray-600">
                همه عطرها به دقت انتخاب و بررسی شده‌اند
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
