import { api } from "@/lib/api/client";
import type { Id, UploadFile } from "@/lib/api/types";

// Upload
export type UploadOptions = {
  path?: string;
  refId?: Id;
  ref?: string;
  field?: string;
};
export const uploadFiles = async (
  files: File | File[],
  options: UploadOptions = {},
) => {
  const form = new FormData();
  for (const file of Array.isArray(files) ? files : [files])
    form.append("files", file);
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) form.append(key, String(value));
  });
  return (
    await api.post<UploadFile[]>("/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  ).data;
};
export const updateUploadFile = async (
  id: Id,
  fileInfo: Pick<UploadFile, "name" | "alternativeText" | "caption">,
) => {
  const form = new FormData();
  form.append("fileInfo", JSON.stringify(fileInfo));
  return (
    await api.post<UploadFile[]>("/upload", form, {
      params: { id },
      headers: { "Content-Type": "multipart/form-data" },
    })
  ).data;
};
export const listUploadFiles = () =>
  api.get<UploadFile[]>("/upload/files").then(({ data }) => data);
export const getUploadFile = (id: Id) =>
  api.get<UploadFile>(`/upload/files/${id}`).then(({ data }) => data);
export const deleteUploadFile = (id: Id) =>
  api.delete<UploadFile>(`/upload/files/${id}`).then(({ data }) => data);
