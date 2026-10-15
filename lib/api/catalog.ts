import { createEntity, deleteEntity, getCollection, getEntity, updateEntity } from "@/lib/api/client";
import type { AuthorOrDirector, Country, CountryInput, Genre, Id, ListParams, NamedRelationInput } from "@/lib/api/types";

// Authors / directors
export const listAuthorsOrDirectors = (params?: ListParams) =>
  getCollection<AuthorOrDirector>("/authors-or-directors", params);
export const createAuthorOrDirector = (data: NamedRelationInput) =>
  createEntity<AuthorOrDirector, NamedRelationInput>(
    "/authors-or-directors",
    data,
  );
export const getAuthorOrDirector = (id: Id, params?: ListParams) =>
  getEntity<AuthorOrDirector>(`/authors-or-directors/${id}`, params);
export const updateAuthorOrDirector = (
  id: Id,
  data: Partial<NamedRelationInput>,
) =>
  updateEntity<AuthorOrDirector, NamedRelationInput>(
    `/authors-or-directors/${id}`,
    data,
  );
export const deleteAuthorOrDirector = (id: Id) =>
  deleteEntity(`/authors-or-directors/${id}`);

// Genres
export const listGenres = (params?: ListParams) =>
  getCollection<Genre>("/genres", params);
export const createGenre = (data: NamedRelationInput) =>
  createEntity<Genre, NamedRelationInput>("/genres", data);
export const getGenre = (id: Id, params?: ListParams) =>
  getEntity<Genre>(`/genres/${id}`, params);
export const updateGenre = (id: Id, data: Partial<NamedRelationInput>) =>
  updateEntity<Genre, NamedRelationInput>(`/genres/${id}`, data);
export const deleteGenre = (id: Id) => deleteEntity(`/genres/${id}`);

// Countries
export const listCountries = (params?: ListParams) =>
  getCollection<Country>("/countries", params);
export const createCountry = (data: CountryInput) =>
  createEntity<Country, CountryInput>("/countries", data);
export const getCountry = (id: Id, params?: ListParams) =>
  getEntity<Country>(`/countries/${id}`, params);
export const updateCountry = (id: Id, data: Partial<CountryInput>) =>
  updateEntity<Country, CountryInput>(`/countries/${id}`, data);
export const deleteCountry = (id: Id) => deleteEntity(`/countries/${id}`);
