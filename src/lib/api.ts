// src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export interface Perfume {
  id: number;
  name: string;
  brand: string;
  price: number;
  description: string;
  image?: StrapiMedia;
  scent_families: string[];
  occasions: string[];
  intensities: string[];
}

// Strapi response interfaces
interface StrapiMedia {
  data?: {
    id: number;
    attributes: {
      url: string;
      name: string;
    };
  };
}

interface StrapiRelation {
  data: Array<{
    id: number;
    attributes: {
      name: string;
    };
  }>;
}

interface StrapiPerfumeAttributes {
  name: string;
  brand?: string;
  price?: number;
  description?: string;
  image?: StrapiMedia;
  scent_families?: StrapiRelation;
  occasions?: StrapiRelation;
  intensities?: StrapiRelation;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface StrapiPerfume {
  id: number;
  attributes: StrapiPerfumeAttributes;
}

interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface StrapiCollectionResponse<T> {
  data: T[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface StrapiAttributeItem {
  id: number;
  attributes: {
    name: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
}

// Persian number formatting
export const formatToman = (price: number): string => {
  return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
};

// Convert English numbers to Persian
export const toPersianNumbers = (str: string): string => {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  return str.replace(/[0-9]/g, (digit) => persianDigits[parseInt(digit)]);
};

// Transform Strapi's nested response to clean data
function transformStrapiData(data: StrapiPerfume[]): Perfume[] {
  if (!data || !Array.isArray(data)) {
    console.log("No data or data is not an array:", data);
    return [];
  }

  console.log("Processing", data.length, "perfumes");

  return data
    .filter((item) => item && item.attributes)
    .map((item: StrapiPerfume) => {
      console.log("Processing perfume:", item.attributes?.name);

      const perfume = {
        id: item.id,
        name: item.attributes?.name || "نام نامشخص",
        brand: item.attributes?.brand || "",
        price: item.attributes?.price || 0,
        description: item.attributes?.description || "",
        image: item.attributes?.image,
        scent_families:
          item.attributes?.scent_families?.data?.map(
            (sf) => sf.attributes.name
          ) || [],
        occasions:
          item.attributes?.occasions?.data?.map((occ) => occ.attributes.name) ||
          [],
        intensities:
          item.attributes?.intensities?.data?.map(
            (int) => int.attributes.name
          ) || [],
      };

      console.log("Transformed perfume:", perfume);
      return perfume;
    });
}

export async function getPerfumes(): Promise<Perfume[]> {
  try {
    const response = await fetch(`${API_URL}/api/perfumes?populate=*`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json: StrapiCollectionResponse<StrapiPerfume> = await response.json();
    console.log("Raw Strapi response:", json);
    return transformStrapiData(json.data);
  } catch (error) {
    console.error("Error fetching perfumes:", error);
    return [];
  }
}

export async function getScentFamilies(): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/api/scent-families`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json: StrapiCollectionResponse<StrapiAttributeItem> =
      await response.json();
    console.log("Raw scent families response:", json);

    if (!json.data || !Array.isArray(json.data)) {
      console.log("No scent families data");
      return [];
    }

    return json.data
      .filter((item) => item && item.attributes && item.attributes.name)
      .map((item) => item.attributes.name);
  } catch (error) {
    console.error("Error fetching scent families:", error);
    return [];
  }
}

export async function getOccasions(): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/api/occasions`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json: StrapiCollectionResponse<StrapiAttributeItem> =
      await response.json();
    console.log("Raw occasions response:", json);

    if (!json.data || !Array.isArray(json.data)) {
      console.log("No occasions data");
      return [];
    }

    return json.data
      .filter((item) => item && item.attributes && item.attributes.name)
      .map((item) => item.attributes.name);
  } catch (error) {
    console.error("Error fetching occasions:", error);
    return [];
  }
}

export async function getIntensities(): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/api/intensities`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json: StrapiCollectionResponse<StrapiAttributeItem> =
      await response.json();
    console.log("Raw intensities response:", json);

    if (!json.data || !Array.isArray(json.data)) {
      console.log("No intensities data");
      return [];
    }

    return json.data
      .filter((item) => item && item.attributes && item.attributes.name)
      .map((item) => item.attributes.name);
  } catch (error) {
    console.error("Error fetching intensities:", error);
    return [];
  }
}
