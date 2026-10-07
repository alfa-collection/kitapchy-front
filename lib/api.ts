import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.137.181";

export const api = axios.create({
  baseURL: `${baseURL.replace(/\/$/, "")}/api`,
  headers: { "Content-Type": "application/json" },
});

export const apiErrorMessage = (error: unknown, fallback = "Something went wrong.") => {
  if (!axios.isAxiosError(error)) return fallback;
  const payload = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
  return payload?.error?.message || payload?.message || error.message || fallback;
};

export type Id = number | string;
export type RelationId = Id;
export type Pagination = { page: number; pageSize: number; pageCount: number; total: number };
export type CollectionMeta = { pagination?: Pagination };
export type CollectionResponse<T> = { data: T[]; meta: CollectionMeta };
export type EntityResponse<T> = { data: T; meta: Record<string, never> };
export type ListParams = Record<string, string | number | boolean | string[] | undefined>;

export type UploadFile = {
  id: number; documentId?: string; name: string; alternativeText?: string | null; caption?: string | null;
  width?: number | null; height?: number | null; formats?: { small?: { url?: string } }; hash?: string;
  ext?: string; mime?: string; size?: number; url?: string; previewUrl?: string | null; provider?: string;
  provider_metadata?: Record<string, unknown> | null; createdAt?: string; updatedAt?: string;
};

export type Relation = { id: Id; documentId?: string; name: string };
export type AuthorOrDirector = Relation & { book_id?: Relation[] };
export type Genre = Relation & { book_id?: Relation[] };
export type Country = Relation & { book_id?: Relation };
export type BookRecord = {
  id?: number; documentId?: string; name: string; slug: string; image?: UploadFile | null; desc?: string;
  genre_id?: Genre[]; country_id?: Country[]; authors_or_directors_id?: AuthorOrDirector[]; difficulty: number;
  views?: number; duration: number; segment_count: number; published?: string; me_liked: boolean;
  canread?: boolean; ismember?: boolean; audio_files?: UploadFile[]; json_files?: UploadFile[];
  createdAt?: string; updatedAt?: string; publishedAt?: string | null;
};

export type BookInput = {
  name: string; slug: string; difficulty: number; duration: number; segment_count: number; me_liked: boolean;
  image?: RelationId; desc?: string; genre_id?: RelationId[]; country_id?: RelationId[];
  authors_or_directors_id?: RelationId[]; views?: number; published?: string; canread?: boolean;
  ismember?: boolean; locale?: string; localizations?: RelationId[];
};
export type NamedRelationInput = { name?: string; book_id?: RelationId[]; locale?: string; localizations?: RelationId[] };
export type CountryInput = { name?: string; book_id?: RelationId; locale?: string; localizations?: RelationId[] };

export type UserRole = { id: number; name: string; description?: string; type: string; createdAt?: string; updatedAt?: string };
export type PaymentMethod = {
  id: string;
  brand: string;
  userName?: string;
};
export type SubscriptionPlan = "one_month" | "three_month" | "six_month" | "one_year";
export type SubscriptionPlanRecord = { id?: number; documentId?: string; plan: SubscriptionPlan; price: number | string; currency: string };
export type UserSubscription = { id?: number; documentId?: string; plan: SubscriptionPlan; status: "active" | "expired" | "cancelled"; starts_at: string; ends_at: string; auto_renew?: boolean; promo_code?: { id?: number; documentId?: string; code?: string; plan?: SubscriptionPlan } | null };
export type PromoValidation = { valid: boolean; message: string; code?: string; plan?: SubscriptionPlan };
export type PromoApplication = PromoValidation & { success?: boolean; subscription?: UserSubscription; starts_at?: string; ends_at?: string };
export type SubscriptionPurchase = { success: boolean; purchase_id: number; plan: SubscriptionPlan; amount: number | string; currency: string; payment_provider: string; payment_reference: string; payment_status: "pending" | "paid" | "failed"; message: string };
export type PaymentConfirmation = { success: boolean; payment_status: "paid"; purchase_id?: number; plan?: SubscriptionPlan; starts_at?: string; ends_at?: string; subscription?: UserSubscription; message: string };
export type DictionaryEntry = { id: number; documentId?: string; word: string; book?: { id?: number; documentId?: string; name?: string; slug?: string } | null };
export type User = { id: number; username: string; email: string; provider?: string; confirmed?: boolean; blocked?: boolean; createdAt?: string; updatedAt?: string; role?: UserRole; plan?: "free" | "pro"; subscription_status?: "inactive" | "active" | "past_due" | "canceled"; subscription_expires_at?: string | null; payment_methods?: PaymentMethod[] };
export type AuthResponse = { jwt: string; user: User };
export type OkResponse = { ok: true };
export type RolePermissions = Record<string, unknown>;

export const mediaUrl = (url?: string) => !url ? undefined : url.startsWith("http") ? url : `${baseURL.replace(/\/$/, "")}${url}`;
export const setAuthToken = (token?: string) => {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
};
export const restoreAuthToken = () => {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("kitapchy_token");
  setAuthToken(token || undefined);
  return Boolean(token);
};
export const persistAuth = ({ jwt, user }: AuthResponse) => {
  setAuthToken(jwt);
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("kitapchy_token", jwt);
    localStorage.setItem("kitapchy_user", JSON.stringify(user));
  } catch {
    // A restrictive browser context can deny storage. Keep this tab signed in.
  }
};
export const clearAuth = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("kitapchy_token");
  localStorage.removeItem("kitapchy_user");
  setAuthToken();
};
export const storedUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem("kitapchy_user");
    return value ? JSON.parse(value) as User : null;
  } catch {
    return null;
  }
};

const getCollection = async <T>(path: string, params?: ListParams) => (await api.get<CollectionResponse<T>>(path, { params })).data;
const getEntity = async <T>(path: string, params?: ListParams) => (await api.get<EntityResponse<T>>(path, { params })).data;
const createEntity = async <T, TInput>(path: string, data: TInput) => (await api.post<EntityResponse<T>>(path, { data })).data;
const updateEntity = async <T, TInput>(path: string, data: Partial<TInput>) => (await api.put<EntityResponse<T>>(path, { data })).data;
const deleteEntity = async (path: string) => (await api.delete<EntityResponse<Id>>(path)).data;

const getBooksThroughProxy = async (params: ListParams) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else query.set(key, String(value));
  });
  const response = await fetch(`/api/book?${query.toString()}`);
  if (!response.ok) throw new Error("Unable to load books.");
  return await response.json() as CollectionResponse<BookRecord>;
};

// Books
export const listBooks = (params?: ListParams) => getCollection<BookRecord>("/books", params);
export const createBook = (data: BookInput) => createEntity<BookRecord, BookInput>("/books", data);
export const getBookById = (id: Id, params?: ListParams) => getEntity<BookRecord>(`/books/${id}`, params);
export const updateBook = (id: Id, data: Partial<BookInput>) => updateEntity<BookRecord, BookInput>(`/books/${id}`, data);
export const deleteBook = (id: Id) => deleteEntity(`/books/${id}`);
export const getBooks = async () => (await getBooksThroughProxy({ populate: "*", "pagination[pageSize]": 100, sort: "published:desc" })).data;
export const getBook = async (slug: string) => (await getBooksThroughProxy({ populate: "*", "filters[slug][$eq]": slug })).data[0] ?? null;
export const listBookmarks = async () => (await api.get<CollectionResponse<BookRecord | null>>("/user-bookmarks")).data.data.filter((book): book is BookRecord => Boolean(book?.name && book.slug));
export const addBookmark = async (bookId: Id) => (await api.post<{ success: boolean }>(`/user-bookmarks/${encodeURIComponent(String(bookId))}`)).data;

// Authors / directors
export const listAuthorsOrDirectors = (params?: ListParams) => getCollection<AuthorOrDirector>("/authors-or-directors", params);
export const createAuthorOrDirector = (data: NamedRelationInput) => createEntity<AuthorOrDirector, NamedRelationInput>("/authors-or-directors", data);
export const getAuthorOrDirector = (id: Id, params?: ListParams) => getEntity<AuthorOrDirector>(`/authors-or-directors/${id}`, params);
export const updateAuthorOrDirector = (id: Id, data: Partial<NamedRelationInput>) => updateEntity<AuthorOrDirector, NamedRelationInput>(`/authors-or-directors/${id}`, data);
export const deleteAuthorOrDirector = (id: Id) => deleteEntity(`/authors-or-directors/${id}`);

// Genres
export const listGenres = (params?: ListParams) => getCollection<Genre>("/genres", params);
export const createGenre = (data: NamedRelationInput) => createEntity<Genre, NamedRelationInput>("/genres", data);
export const getGenre = (id: Id, params?: ListParams) => getEntity<Genre>(`/genres/${id}`, params);
export const updateGenre = (id: Id, data: Partial<NamedRelationInput>) => updateEntity<Genre, NamedRelationInput>(`/genres/${id}`, data);
export const deleteGenre = (id: Id) => deleteEntity(`/genres/${id}`);

// Countries
export const listCountries = (params?: ListParams) => getCollection<Country>("/countries", params);
export const createCountry = (data: CountryInput) => createEntity<Country, CountryInput>("/countries", data);
export const getCountry = (id: Id, params?: ListParams) => getEntity<Country>(`/countries/${id}`, params);
export const updateCountry = (id: Id, data: Partial<CountryInput>) => updateEntity<Country, CountryInput>(`/countries/${id}`, data);
export const deleteCountry = (id: Id) => deleteEntity(`/countries/${id}`);

// Upload
export type UploadOptions = { path?: string; refId?: Id; ref?: string; field?: string };
export const uploadFiles = async (files: File | File[], options: UploadOptions = {}) => {
  const form = new FormData();
  for (const file of Array.isArray(files) ? files : [files]) form.append("files", file);
  Object.entries(options).forEach(([key, value]) => { if (value !== undefined) form.append(key, String(value)); });
  return (await api.post<UploadFile[]>("/upload", form, { headers: { "Content-Type": "multipart/form-data" } })).data;
};
export const updateUploadFile = async (id: Id, fileInfo: Pick<UploadFile, "name" | "alternativeText" | "caption">) => {
  const form = new FormData(); form.append("fileInfo", JSON.stringify(fileInfo));
  return (await api.post<UploadFile[]>("/upload", form, { params: { id }, headers: { "Content-Type": "multipart/form-data" } })).data;
};
export const listUploadFiles = () => api.get<UploadFile[]>("/upload/files").then(({ data }) => data);
export const getUploadFile = (id: Id) => api.get<UploadFile>(`/upload/files/${id}`).then(({ data }) => data);
export const deleteUploadFile = (id: Id) => api.delete<UploadFile>(`/upload/files/${id}`).then(({ data }) => data);

// Authentication
export const login = (identifier: string, password: string) => api.post<AuthResponse>("/auth/local", { identifier, password }).then(({ data }) => data);
export const register = (username: string, email: string, password: string) => api.post<AuthResponse>("/auth/local/register", { username, email, password }).then(({ data }) => data);
export const authenticate = (mode: "signin" | "signup", email: string, password: string) => mode === "signin" ? login(email, password) : register(email.split("@")[0], email, password);
export const forgotPassword = (email: string) => api.post<OkResponse>("/auth/forgot-password", { email }).then(({ data }) => data);
export const resetPassword = (password: string, passwordConfirmation: string, code: string) => api.post<AuthResponse>("/auth/reset-password", { password, passwordConfirmation, code }).then(({ data }) => data);
export const changePassword = (currentPassword: string, password: string, passwordConfirmation: string) => api.post<AuthResponse>("/auth/change-password", { currentPassword, password, passwordConfirmation }).then(({ data }) => data);
export const confirmEmail = (confirmation: string) => api.get("/auth/email-confirmation", { params: { confirmation } });
export const sendEmailConfirmation = (email: string) => api.post<{ email: string; sent: true }>("/auth/send-email-confirmation", { email }).then(({ data }) => data);
export const providerLoginUrl = (provider: string) => `${api.defaults.baseURL}/connect/${encodeURIComponent(provider)}`;
export const completeProviderLogin = (provider: string, params?: ListParams) => api.get<AuthResponse>(`/auth/${encodeURIComponent(provider)}/callback`, { params }).then(({ data }) => data);

// Users and roles
export const getPermissions = () => api.get<RolePermissions>("/users-permissions/permissions").then(({ data }) => data);
export const listRoles = () => api.get<{ roles: UserRole[] }>("/users-permissions/roles").then(({ data }) => data);
export const createRole = (data: { name: string; description?: string; type?: string; permissions?: RolePermissions }) => api.post<UserRole>("/users-permissions/roles", data).then(({ data: response }) => response);
export const getRole = (id: Id) => api.get<UserRole>(`/users-permissions/roles/${id}`).then(({ data }) => data);
export const updateRole = (id: Id, data: { name?: string; description?: string; type?: string; permissions?: RolePermissions }) => api.put<OkResponse>(`/users-permissions/roles/${id}`, data).then(({ data: response }) => response);
export const deleteRole = (id: Id) => api.delete<OkResponse>(`/users-permissions/roles/${id}`).then(({ data }) => data);
export const listUsers = () => api.get<User[]>("/users").then(({ data }) => data);
export const createUser = (data: { username: string; email: string; password: string }) => api.post<User>("/users", data).then(({ data: response }) => response);
export const getUser = (id: Id) => api.get<User>(`/users/${id}`).then(({ data }) => data);
export const updateUser = (id: Id, data: Partial<User> & { password?: string; role?: Id }) => api.put<User>(`/users/${id}`, data).then(({ data: response }) => response);
export const deleteUser = (id: Id) => api.delete<User>(`/users/${id}`).then(({ data }) => data);
export const getCurrentUser = () => api.get<User>("/users/me").then(({ data }) => data);
export const countUsers = () => api.get<number>("/users/count").then(({ data }) => data);

// Memberships and promo codes
export const listUserSubscriptions = async () => {
  const response = await api.get<CollectionResponse<UserSubscription> | UserSubscription[]>("/user-subscriptions");
  const rows = Array.isArray(response.data) ? response.data : response.data.data || [];
  return rows.map((row) => {
    const wrapped = row as UserSubscription & { attributes?: UserSubscription };
    return wrapped.attributes ? { ...wrapped.attributes, id: wrapped.id, documentId: wrapped.documentId } : row;
  });
};
export const validatePromoCode = (code: string) => api.post<PromoValidation>("/promo-codes/validate", { code }).then(({ data }) => data);
export const applyPromoCode = (code: string) => api.post<PromoApplication>("/promo-codes/apply", { code }).then(({ data }) => data);
export const listSubscriptionPlans = async () => {
  const response = await api.get<CollectionResponse<SubscriptionPlanRecord> | SubscriptionPlanRecord[]>("/subscription-plans");
  const rows = Array.isArray(response.data) ? response.data : response.data.data || [];
  return rows.map((row) => {
    const wrapped = row as SubscriptionPlanRecord & { attributes?: SubscriptionPlanRecord };
    return wrapped.attributes ? { ...wrapped.attributes, id: wrapped.id, documentId: wrapped.documentId } : row;
  });
};
export const purchaseSubscription = (plan: SubscriptionPlan) => api.post<SubscriptionPurchase>("/user-subscriptions/purchase", { plan }).then(({ data }) => data);
export const confirmMockSubscriptionPayment = (purchaseId: number) => api.post<PaymentConfirmation>(`/user-subscriptions/purchases/${purchaseId}/mock-confirm`).then(({ data }) => data);

// Personal dictionary
export const listDictionaryEntries = async () => {
  const response = await api.get<CollectionResponse<DictionaryEntry> | DictionaryEntry[]>("/dictionaries");
  const rows = Array.isArray(response.data) ? response.data : response.data.data || [];
  return rows.map((row) => {
    const wrapped = row as DictionaryEntry & { attributes?: DictionaryEntry };
    return wrapped.attributes ? { ...wrapped.attributes, id: wrapped.id, documentId: wrapped.documentId } : row;
  });
};
export const addDictionaryWord = (word: string, bookId: number) => api.post<{ success: boolean; id: number }>("/dictionaries", { word, bookId }).then(({ data }) => data);
export const deleteDictionaryWord = (id: number) => api.delete<{ success: boolean }>(`/dictionaries/${id}`).then(({ data }) => data);
