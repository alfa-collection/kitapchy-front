import { api } from "@/lib/api/client";
import type { CollectionResponse, DictionaryEntry } from "@/lib/api/types";

// Personal dictionary
export const listDictionaryEntries = async () => {
  const response = await api.get<
    CollectionResponse<DictionaryEntry> | DictionaryEntry[]
  >("/dictionaries");
  const rows = Array.isArray(response.data)
    ? response.data
    : response.data.data || [];
  return rows.map((row) => {
    const wrapped = row as DictionaryEntry & { attributes?: DictionaryEntry };
    return wrapped.attributes
      ? {
          ...wrapped.attributes,
          id: wrapped.id,
          documentId: wrapped.documentId,
        }
      : row;
  });
};
export const addDictionaryWord = (word: string, bookId: number) =>
  api
    .post<{ success: boolean; id: number }>("/dictionaries", { word, bookId })
    .then(({ data }) => data);
export const deleteDictionaryWord = (id: number) =>
  api
    .delete<{ success: boolean }>(`/dictionaries/${id}`)
    .then(({ data }) => data);
