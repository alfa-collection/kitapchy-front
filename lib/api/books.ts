import { api, createEntity, deleteEntity, getCollection, getEntity, updateEntity } from "@/lib/api/client";
import type { BookInput, BookRecord, CollectionResponse, Id, ListParams } from "@/lib/api/types";

// Books
export const listBooks = (params?: ListParams) =>
  getCollection<BookRecord>("/books", params);
export const createBook = (data: BookInput) =>
  createEntity<BookRecord, BookInput>("/books", data);
export const getBookById = (id: Id, params?: ListParams) =>
  getEntity<BookRecord>(`/books/${id}`, params);
export const updateBook = (id: Id, data: Partial<BookInput>) =>
  updateEntity<BookRecord, BookInput>(`/books/${id}`, data);
export const deleteBook = (id: Id) => deleteEntity(`/books/${id}`);
export const getBooks = async () =>
  (
    await listBooks({
      populate: "*",
      "pagination[pageSize]": 100,
      sort: "published:desc",
    })
  ).data;
export const getBook = async (slug: string) =>
  (await listBooks({ populate: "*", "filters[slug][$eq]": slug })).data[0] ??
  null;
export const getSimilarBooks = async (
  genreNames: string[],
  excludeSlug: string,
  limit = 4,
) => {
  if (!genreNames.length) return [];

  return (
    await listBooks({
      populate: "*",
      "filters[genre_id][name][$in]": genreNames,
      "filters[slug][$ne]": excludeSlug,
      "pagination[pageSize]": limit,
      sort: "views:desc",
    })
  ).data;
};
export const listBookmarks = async () =>
  (
    await api.get<CollectionResponse<BookRecord | null>>("/user-bookmarks")
  ).data.data.filter((book): book is BookRecord =>
    Boolean(book?.name && book.slug),
  );
export const addBookmark = async (bookId: Id) =>
  (
    await api.post<{ success: boolean }>(
      `/user-bookmarks/${encodeURIComponent(String(bookId))}`,
    )
  ).data;
export const removeBookmark = async (bookmarkId: Id) =>
  (
    await api.delete<{ success: boolean }>(
      `/user-bookmarks/${encodeURIComponent(String(bookmarkId))}`,
    )
  ).data;
