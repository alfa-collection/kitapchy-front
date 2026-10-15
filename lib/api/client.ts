import axios from "axios";

import type { CollectionResponse, EntityResponse, Id, ListParams } from "@/lib/api/types";

export const apiOrigin = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

if (!apiOrigin) throw new Error("NEXT_PUBLIC_API_URL is required.");

export const api = axios.create({
  baseURL: `${apiOrigin}/api`,
  headers: { "Content-Type": "application/json" },
});

export const apiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong.",
) => {
  if (!axios.isAxiosError(error)) return fallback;
  const payload = error.response?.data as
    | { error?: { message?: string }; message?: string }
    | undefined;
  return payload?.error?.message || payload?.message || error.message || fallback;
};

export const getCollection = async <T>(path: string, params?: ListParams) =>
  (await api.get<CollectionResponse<T>>(path, { params })).data;
export const getEntity = async <T>(path: string, params?: ListParams) =>
  (await api.get<EntityResponse<T>>(path, { params })).data;
export const createEntity = async <T, TInput>(path: string, data: TInput) =>
  (await api.post<EntityResponse<T>>(path, { data })).data;
export const updateEntity = async <T, TInput>(path: string, data: Partial<TInput>) =>
  (await api.put<EntityResponse<T>>(path, { data })).data;
export const deleteEntity = async (path: string) =>
  (await api.delete<EntityResponse<Id>>(path)).data;
