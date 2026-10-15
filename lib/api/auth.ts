import { api, apiOrigin } from "@/lib/api/client";
import type { AuthResponse, ListParams, OkResponse, User } from "@/lib/api/types";

export const mediaUrl = (url?: string) =>
  !url ? undefined : url.startsWith("http") ? url : `${apiOrigin}${url}`;
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
    return value ? (JSON.parse(value) as User) : null;
  } catch {
    return null;
  }
};

// Authentication
export const login = (identifier: string, password: string) =>
  api
    .post<AuthResponse>("/auth/local", { identifier, password })
    .then(({ data }) => data);
export const register = (username: string, email: string, password: string) =>
  api
    .post<AuthResponse>("/auth/local/register", { username, email, password })
    .then(({ data }) => data);
export const authenticate = (
  mode: "signin" | "signup",
  email: string,
  password: string,
) =>
  mode === "signin"
    ? login(email, password)
    : register(email.split("@")[0], email, password);
export const forgotPassword = (email: string) =>
  api
    .post<OkResponse>("/auth/forgot-password", { email })
    .then(({ data }) => data);
export const resetPassword = (
  password: string,
  passwordConfirmation: string,
  code: string,
) =>
  api
    .post<AuthResponse>("/auth/reset-password", {
      password,
      passwordConfirmation,
      code,
    })
    .then(({ data }) => data);
export const changePassword = (
  currentPassword: string,
  password: string,
  passwordConfirmation: string,
) =>
  api
    .post<AuthResponse>("/auth/change-password", {
      currentPassword,
      password,
      passwordConfirmation,
    })
    .then(({ data }) => data);
export const confirmEmail = (confirmation: string) =>
  api.get("/auth/email-confirmation", { params: { confirmation } });
export const sendEmailConfirmation = (email: string) =>
  api
    .post<{
      email: string;
      sent: true;
    }>("/auth/send-email-confirmation", { email })
    .then(({ data }) => data);
export const providerLoginUrl = (provider: string) =>
  `${api.defaults.baseURL}/connect/${encodeURIComponent(provider)}`;
export const completeProviderLogin = (provider: string, params?: ListParams) =>
  api
    .get<AuthResponse>(`/auth/${encodeURIComponent(provider)}/callback`, {
      params,
    })
    .then(({ data }) => data);
