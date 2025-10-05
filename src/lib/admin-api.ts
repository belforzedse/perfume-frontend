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
  name?: string | null;
}

export interface AdminBrand {
  id: number;
  name: string;
}

const mapBrand = (entity: StrapiEntity<BrandAttributes>): AdminBrand => {
  // In Strapi v5, attributes are at root level
  const attributes = entity.attributes ?? (entity as any);

  return {
    id: entity.id,
    name: attributes.name?.trim() ?? "",
  };
};

interface CollectionAttributes {
  name?: string | null;
}

export interface AdminCollection {
  id: number;
  name: string;
}

const mapCollection = (
  entity: StrapiEntity<CollectionAttributes>,
): AdminCollection => {
  // In Strapi v5, attributes are at root level
  const attributes = entity.attributes ?? (entity as any);

  return {
    id: entity.id,
    name: attributes.name?.trim() ?? "",
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
  brand?: BrandAttributes | null;
  collection?: CollectionAttributes | null;
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
  image?: string;
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

const extractImageUrl = (cover: any): string | undefined => {
  if (!cover) return undefined;

  // Handle different possible structures for cover data
  const coverData = cover.data || cover;
  if (coverData?.url) {
    let url = coverData.url;
    // Make relative URLs absolute
    if (url.startsWith('/')) {
      url = `${API_URL}${url}`;
    }
    return url;
  }

  return undefined;
};

const mapPerfume = (entity: StrapiEntity<PerfumeAttributes>): AdminPerfume => {
  // In Strapi v5, attributes are at root level
  const attributes = entity.attributes ?? (entity as any);

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
    brand: attributes.brand ? { id: (attributes.brand as any).id || 0, name: attributes.brand.name || "" } : null,
    collection: attributes.collection ? { id: attributes.collection.id || 0, name: attributes.collection.name || "" } : null,
    image: extractImageUrl(attributes.cover),
  };
};

export interface CreateBrandPayload {
  name: string;
}

export interface CreateCollectionPayload {
  name: string;
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
  cover?: number;
}

export const fetchBrandsAdmin = async (): Promise<AdminBrand[]> => {
  const response = await adminClient.get<StrapiListResponse<BrandAttributes>>(
    "/api/brands",
    {
      headers: authHeaders(),
      params: {
        "pagination[pageSize]": 100,
        sort: "name:asc",
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
      sort: "name:asc",
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
        "populate[brand][fields][0]": "name",
        "populate[collection][fields][0]": "name",
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
  });

  return mapCollection(response.data.data);
};

export const uploadFile = async (file: File): Promise<{ id: number; url: string }> => {
  const formData = new FormData();
  formData.append('files', file);

  const response = await adminClient.post('/api/upload', formData, {
    headers: {
      ...authHeaders(),
      // Don't set Content-Type for FormData - let the browser set it
    },
  });

  if (response.data && response.data[0]) {
    return {
      id: response.data[0].id,
      url: response.data[0].url,
    };
  }

  throw new Error('File upload failed');
};

export const createPerfume = async (
  payload: CreatePerfumePayload,
): Promise<AdminPerfume> => {
  const response = await adminClient.post<
    StrapiSingleResponse<PerfumeAttributes>
  >("/api/perfumes", { data: payload }, {
    headers: authHeaders(true),
    params: {
      "populate[brand][fields][0]": "name",
      "populate[collection][fields][0]": "name",
      "populate[cover][fields][0]": "url",
    },
  });

  return mapPerfume(response.data.data);
};

export interface UpdatePerfumePayload extends CreatePerfumePayload {}

export const updatePerfume = async (
  id: number,
  payload: UpdatePerfumePayload,
): Promise<AdminPerfume> => {
  const response = await adminClient.put<
    StrapiSingleResponse<PerfumeAttributes>
  >(`/api/perfumes/${id}`, { data: payload }, {
    headers: authHeaders(true),
    params: {
      "populate[brand][fields][0]": "name",
      "populate[collection][fields][0]": "name",
      "populate[cover][fields][0]": "url",
    },
  });

  return mapPerfume(response.data.data);
};

export const deletePerfume = async (id: number): Promise<void> => {
  await adminClient.delete(`/api/perfumes/${id}`, {
    headers: authHeaders(),
  });
};
