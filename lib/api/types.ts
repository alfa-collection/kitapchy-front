export type Id = number | string;
export type RelationId = Id;
export type Pagination = {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
};
export type CollectionMeta = { pagination?: Pagination };
export type CollectionResponse<T> = { data: T[]; meta: CollectionMeta };
export type EntityResponse<T> = { data: T; meta: Record<string, never> };
export type ListParams = Record<
  string,
  string | number | boolean | string[] | undefined
>;

export type UploadFile = {
  id: number;
  documentId?: string;
  name: string;
  alternativeText?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  formats?: { small?: { url?: string } };
  hash?: string;
  ext?: string;
  mime?: string;
  size?: number;
  url?: string;
  previewUrl?: string | null;
  provider?: string;
  provider_metadata?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Relation = { id: Id; documentId?: string; name: string };
export type AuthorOrDirector = Relation & { book_id?: Relation[] };
export type Genre = Relation & { book_id?: Relation[] };
export type Country = Relation & { book_id?: Relation };
export type BookRecord = {
  id?: number;
  documentId?: string;
  name: string;
  slug: string;
  image?: UploadFile | null;
  desc?: string;
  genre_id?: Genre[];
  country_id?: Country[];
  authors_or_directors_id?: AuthorOrDirector[];
  difficulty: number;
  views?: number;
  duration: number;
  segment_count: number;
  published?: string;
  me_liked: boolean;
  canread?: boolean;
  ismember?: boolean;
  audio_files?: UploadFile[];
  json_files?: UploadFile[];
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
};

export type BookInput = {
  name: string;
  slug: string;
  difficulty: number;
  duration: number;
  segment_count: number;
  me_liked: boolean;
  image?: RelationId;
  desc?: string;
  genre_id?: RelationId[];
  country_id?: RelationId[];
  authors_or_directors_id?: RelationId[];
  views?: number;
  published?: string;
  canread?: boolean;
  ismember?: boolean;
  locale?: string;
  localizations?: RelationId[];
};
export type NamedRelationInput = {
  name?: string;
  book_id?: RelationId[];
  locale?: string;
  localizations?: RelationId[];
};
export type CountryInput = {
  name?: string;
  book_id?: RelationId;
  locale?: string;
  localizations?: RelationId[];
};

export type UserRole = {
  id: number;
  name: string;
  description?: string;
  type: string;
  createdAt?: string;
  updatedAt?: string;
};
export type PaymentMethod = {
  id: string;
  brand: string;
  userName?: string;
};
export type SubscriptionPlan =
  | "one_month"
  | "three_month"
  | "six_month"
  | "one_year";
export type SubscriptionPlanRecord = {
  id?: number;
  documentId?: string;
  plan: SubscriptionPlan;
  price: number | string;
  currency: string;
};
export type UserSubscription = {
  id?: number;
  documentId?: string;
  plan: SubscriptionPlan;
  status: "active" | "expired" | "cancelled";
  starts_at: string;
  ends_at: string;
  auto_renew?: boolean;
  promo_code?: {
    id?: number;
    documentId?: string;
    code?: string;
    plan?: SubscriptionPlan;
  } | null;
};
export type PromoValidation = {
  valid: boolean;
  message: string;
  code?: string;
  plan?: SubscriptionPlan;
};
export type PromoApplication = PromoValidation & {
  success?: boolean;
  subscription?: UserSubscription;
  starts_at?: string;
  ends_at?: string;
};
export type SubscriptionPurchase = {
  success: boolean;
  purchase_id: number;
  plan: SubscriptionPlan;
  amount: number | string;
  currency: string;
  payment_provider: string;
  payment_reference: string;
  payment_status: "pending" | "paid" | "failed";
  message: string;
};
export type PaymentConfirmation = {
  success: boolean;
  payment_status: "paid";
  purchase_id?: number;
  plan?: SubscriptionPlan;
  starts_at?: string;
  ends_at?: string;
  subscription?: UserSubscription;
  message: string;
};
export type DictionaryEntry = {
  id: number;
  documentId?: string;
  word: string;
  book?: {
    id?: number;
    documentId?: string;
    name?: string;
    slug?: string;
  } | null;
};
export type User = {
  id: number;
  username: string;
  email: string;
  provider?: string;
  confirmed?: boolean;
  blocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
  role?: UserRole;
  plan?: "free" | "pro";
  subscription_status?: "inactive" | "active" | "past_due" | "canceled";
  subscription_expires_at?: string | null;
  payment_methods?: PaymentMethod[];
};
export type AuthResponse = { jwt: string; user: User };
export type OkResponse = { ok: true };
export type RolePermissions = Record<string, unknown>;
