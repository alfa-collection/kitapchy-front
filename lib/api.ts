import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

export const api = axios.create({
  baseURL: `${baseURL.replace(/\/$/, "")}/api`,
  headers: { "Content-Type": "application/json" },
});

export const mediaUrl = (url?: string) => {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${baseURL.replace(/\/$/, "")}${url}`;
};

const bookApi = axios.create({ baseURL: "/api" });

export const getBooks = async () => {
  const { data } = await bookApi.get("/book", {
    params: { populate: "*", "pagination[pageSize]": 30, sort: "published:desc" },
  });
  return data.data;
};

export const getBook = async (slug: string) => {
  const { data } = await bookApi.get("/book", {
    params: { populate: "*", "filters[slug][$eq]": slug },
  });
  return data.data?.[0] ?? null;
};

export const authenticate = async (mode: "signin" | "signup", email: string, password: string) => {
  const endpoint = mode === "signin" ? "/auth/local" : "/auth/local/register";
  const payload = mode === "signin"
    ? { identifier: email, password }
    : { username: email.split("@")[0], email, password };
  const { data } = await api.post(endpoint, payload);
  return data;
};
