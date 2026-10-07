"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/language";

export function PageLoading({ label }: { label?: string }) {
  const { text } = useLanguage();
  return <div className="page-loading" role="status" aria-live="polite"><div className="loading-emblem" aria-hidden="true"><Image src="/logo.png" alt="" width={450} height={450} /></div><strong>{label || text("Preparing your reading space…", "Готовим пространство для чтения…")}</strong><p>{text("Just a moment while everything falls into place.", "Подождите немного, пока всё загружается.")}</p><div className="loading-track" aria-hidden="true"><i /></div></div>;
}

export function BookGridLoading({ count = 4 }: { count?: number }) {
  const { text } = useLanguage();
  return <div className="loading-grid" role="status" aria-label={text("Loading books", "Загрузка книг")} aria-live="polite">{Array.from({ length: count }, (_, index) => <div className="loading-book-card" aria-hidden="true" key={index}><div className="loading-cover" /><div className="loading-row"><i /><i /></div><span /><small /></div>)}</div>;
}
