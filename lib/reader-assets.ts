import type { Book } from "@/lib/books";

export type ReaderSentence = {
  id: string;
  text: string;
  translation: string;
  audio: string;
  begin: number;
  end: number;
  part?: number;
};

export type BookManifest = {
  sentence_count?: number;
  audio_files?: Array<{ name: string; duration?: number }>;
  chapters?: Array<{
    title?: string;
    start?: number;
    audio?: string;
    sentence_id?: string;
  }>;
};

type TextFile = { sentences?: ReaderSentence[] };

const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const legacyAssetFolders: Record<string, string> = {
  "doyle-the-red-headed-league": "arthur-conan-doyle-the-red-headed-league",
  "can-you-keep-a-secret": "sophie-kinsella-can-you-keep-a-secret",
};

const normalizeSlug = (value?: string) =>
  value
    ?.replace(/\.[a-z0-9]+$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "";

export function readerAssetFolder(book: Book) {
  const author = normalizeSlug(book.authors_or_directors_id?.[0]?.name);
  const slug = normalizeSlug(book.slug);
  if (!slug) return "";
  if (legacyAssetFolders[slug]) return legacyAssetFolders[slug];
  if (!author || slug.startsWith(`${author}-`)) return slug;
  return `${author}-${slug}`;
}

export function readerAssetUrl(folder: string, file: string) {
  if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL is required.");
  const safeFile = file.split("/").map(encodeURIComponent).join("/");
  return `${apiUrl}/books/${encodeURIComponent(folder)}/${safeFile}`;
}

const readerRequestHeaders = () => {
  if (typeof window === "undefined") return undefined;
  const token = localStorage.getItem("kitapchy_token");
  return token ? { Authorization: `Bearer ${token}` } : undefined;
};

const loadReaderJson = (folder: string, file: string) => {
  const url = new URL(readerAssetUrl(folder, file));
  // Book files are cached for a long time by nginx. A cache-busting query keeps
  // a previously cached 404 from hiding a JSON file uploaded later.
  url.searchParams.set("reader", Date.now().toString(36));
  return fetch(url, {
    cache: "no-store",
    headers: readerRequestHeaders(),
  });
};

export async function loadTextPart(folder: string, part: number) {
  const response = await loadReaderJson(folder, `chunks/text_${part}.json`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Unable to load the book text.");
  const payload = (await response.json()) as TextFile;
  return (payload.sentences || []).map((sentence) => ({ ...sentence, part }));
}

export async function loadManifest(folder: string) {
  const response = await loadReaderJson(folder, "manifest.json");
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Unable to load book details.");
  return (await response.json()) as BookManifest;
}

export const audioFileName = (audio: string) =>
  audio.split("/").at(-1) || "";

export function formatReaderTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainder = safeSeconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}
