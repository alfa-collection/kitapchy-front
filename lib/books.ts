export type Book = {
  id?: number;
  documentId?: string;
  name: string;
  slug: string;
  desc?: string;
  difficulty?: number;
  duration?: number | string;
  segment_count?: number;
  published?: string;
  views?: number;
  image?: { name?: string; url?: string; formats?: { small?: { url?: string } } } | null;
  genre_id?: Array<{ name: string }>;
  authors_or_directors_id?: Array<{ name: string }>;
};

/** The API stores duration in seconds; sample data may already be formatted. */
export const formatBookDuration = (duration?: number | string) => {
  if (duration === undefined || duration === null || duration === "") return "—";
  if (typeof duration === "string" && !/^\d+(?:\.\d+)?$/.test(duration.trim())) return duration;
  const seconds = typeof duration === "number" ? duration : Number(duration);
  if (!Number.isFinite(seconds)) return "—";
  const totalMinutes = Math.max(0, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes}m`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
};
