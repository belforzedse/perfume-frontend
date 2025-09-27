import axios from "axios";

import { API_URL, STRAPI_TOKEN } from "./api";

const adminClient = axios.create({
  baseURL: API_URL,
});

const authHeaders = (includeContentType = false) => {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (STRAPI_TOKEN) {
    headers.Authorization = `Bearer ${STRAPI_TOKEN}`;
  }

  return headers;
};

interface StrapiEntity<T> {
  id: number;
  attributes?: T | null;
}

interface StrapiListResponse<T> {
  data: Array<StrapiEntity<T>>;
}

interface StrapiSingleResponse<T> {
  data: StrapiEntity<T>;
}

interface StrapiRelation<T> {
  data?: StrapiEntity<T> | null;
}

interface BrandAttributes {
  name_fa?: string | null;
  name_en?: string | null;
  description?: string | null;
  slug?: string | null;
  website?: string | null;
}

export interface AdminBrand {
  id: number;
  name_fa: string;
  name_en: string;
  description?: string;
  slug?: string;
  website?: string;
}

const mapBrand = (entity: StrapiEntity<BrandAttributes>): AdminBrand => {
  const attributes = entity.attributes ?? {};

  return {
    id: entity.id,
    name_fa: attributes.name_fa?.trim() ?? "",
    name_en: attributes.name_en?.trim() ?? "",
    description: attributes.description?.trim() || undefined,
    slug: attributes.slug?.trim() || undefined,
    website: attributes.website?.trim() || undefined,
  };
};

interface CollectionAttributes {
  name_fa?: string | null;
  name_en?: string | null;
  description?: string | null;
  slug?: string | null;
  brand?: StrapiRelation<BrandAttributes>;
}

export interface AdminCollection {
  id: number;
  name_fa: string;
  name_en: string;
  description?: string;
  slug?: string;
  brand?: AdminBrand | null;
}

const mapCollection = (
  entity: StrapiEntity<CollectionAttributes>,
): AdminCollection => {
  const attributes = entity.attributes ?? {};
  const brandData = attributes.brand?.data ?? null;

  return {
    id: entity.id,
    name_fa: attributes.name_fa?.trim() ?? "",
    name_en: attributes.name_en?.trim() ?? "",
    description: attributes.description?.trim() || undefined,
    slug: attributes.slug?.trim() || undefined,
    brand: brandData ? mapBrand(brandData) : null,
  };
};

interface PerfumeNotesAttributes {
  top?: string[] | null;
  middle?: string[] | null;
  base?: string[] | null;
}

export interface PerfumeNotes {
  top: string[];
  middle: string[];
  base: string[];
}

interface PerfumeAttributes {
  name_fa?: string | null;
  name_en?: string | null;
  description?: string | null;
  gender?: string | null;
  season?: string | null;
  family?: string | null;
  character?: string | null;
  notes?: PerfumeNotesAttributes | null;
  brand?: StrapiRelation<BrandAttributes>;
  collection?: StrapiRelation<CollectionAttributes>;
}

export interface AdminPerfume {
  id: number;
  name_fa: string;
  name_en: string;
  description?: string;
  gender?: string;
  season?: string;
  family?: string;
  character?: string;
  notes: PerfumeNotes;
  brand?: AdminBrand | null;
  collection?: AdminCollection | null;
}

const normaliseNotes = (
  notes: PerfumeNotesAttributes | null | undefined,
): PerfumeNotes => {
  const toArray = (value?: string[] | null) =>
    Array.isArray(value) ? [...value] : [];

  return {
    top: toArray(notes?.top),
    middle: toArray(notes?.middle),
    base: toArray(notes?.base),
  };
};

const mapPerfume = (entity: StrapiEntity<PerfumeAttributes>): AdminPerfume => {
  const attributes = entity.attributes ?? {};
  const brandData = attributes.brand?.data ?? null;
  const collectionData = attributes.collection?.data ?? null;

  return {
    id: entity.id,
    name_fa: attributes.name_fa?.trim() ?? "",
    name_en: attributes.name_en?.trim() ?? "",
    description: attributes.description?.trim() || undefined,
    gender: attributes.gender?.trim() || undefined,
    season: attributes.season?.trim() || undefined,
    family: attributes.family?.trim() || undefined,
    character: attributes.character?.trim() || undefined,
    notes: normaliseNotes(attributes.notes),
    brand: brandData ? mapBrand(brandData) : null,
    collection: collectionData ? mapCollection(collectionData) : null,
  };
};

export interface CreateBrandPayload {
  name_fa: string;
  name_en: string;
  description?: string;
  slug?: string;
  website?: string;
}

export interface CreateCollectionPayload {
  name_fa: string;
  name_en: string;
  description?: string;
  slug?: string;
  brand?: number;
}

export interface CreatePerfumePayload {
  name_fa: string;
  name_en: string;
  description?: string;
  gender?: string;
  season?: string;
  family?: string;
  character?: string;
  notes: PerfumeNotes;
  brand?: number;
  collection?: number;
}

export const fetchBrandsAdmin = async (): Promise<AdminBrand[]> => {
  const response = await adminClient.get<StrapiListResponse<BrandAttributes>>(
    "/api/brands",
    {
      headers: authHeaders(),
      params: {
        "pagination[pageSize]": 100,
        sort: "name_fa:asc",
      },
    },
  );

  return response.data.data.map(mapBrand);
};

export const fetchCollectionsAdmin = async (): Promise<AdminCollection[]> => {
  const response = await adminClient.get<
    StrapiListResponse<CollectionAttributes>
  >("/api/collections", {
    headers: authHeaders(),
    params: {
      "pagination[pageSize]": 100,
      populate: "brand",
      sort: "name_fa:asc",
    },
  });

  return response.data.data.map(mapCollection);
};

export const fetchPerfumesAdmin = async (): Promise<AdminPerfume[]> => {
  const response = await adminClient.get<StrapiListResponse<PerfumeAttributes>>(
    "/api/perfumes",
    {
      headers: authHeaders(),
      params: {
        "pagination[pageSize]": 50,
        populate: "brand,collection",
        sort: "updatedAt:desc",
      },
    },
  );

  return response.data.data.map(mapPerfume);
};

export const createBrand = async (
  payload: CreateBrandPayload,
): Promise<AdminBrand> => {
  const response = await adminClient.post<StrapiSingleResponse<BrandAttributes>>(
    "/api/brands",
    { data: payload },
    { headers: authHeaders(true) },
  );

  return mapBrand(response.data.data);
};

export const createCollection = async (
  payload: CreateCollectionPayload,
): Promise<AdminCollection> => {
  const response = await adminClient.post<
    StrapiSingleResponse<CollectionAttributes>
  >("/api/collections", { data: payload }, {
    headers: authHeaders(true),
    params: { populate: "brand" },
  });

  return mapCollection(response.data.data);
};

export const createPerfume = async (
  payload: CreatePerfumePayload,
): Promise<AdminPerfume> => {
  const response = await adminClient.post<
    StrapiSingleResponse<PerfumeAttributes>
  >("/api/perfumes", { data: payload }, {
    headers: authHeaders(true),
    params: { populate: "brand,collection" },
  });

  return mapPerfume(response.data.data);
};
