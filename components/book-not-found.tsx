"use client";

import Link from "next/link";
import { UiIcon } from "@/components/ui-icon";
import { useLanguage } from "@/lib/language";

export function BookNotFound({ detail }: { detail?: string }) {
  const { text } = useLanguage();

  return (
    <section className="book-not-found" role="status" aria-labelledby="book-not-found-title">
      <div className="missing-book-art" aria-hidden="true">
        <span className="missing-page page-back" />
        <span className="missing-page page-front">
          <UiIcon name="library" size={38} />
          <b>404</b>
        </span>
        <i />
      </div>
      <div className="book-not-found-copy">
        <p className="eyebrow">{text("BOOK NOT FOUND", "КНИГА НЕ НАЙДЕНА", "KITAP TAPYLMADY")}</p>
        <h1 id="book-not-found-title">{text("This story isn’t on the shelf.", "Этой книги нет на полке.", "Bu kitap tekjede ýok.")}</h1>
        <p>{detail || text("The book may have moved, become unavailable, or the link may be incorrect.", "Возможно, книгу переместили, она недоступна или ссылка указана неверно.", "Kitap başga ýere geçirilip biler, elýeterli däl ýa-da salgy nädogry bolup biler.")}</p>
        <div className="book-not-found-actions">
          <Link href="/catalog" className="button primary">
            {text("Browse the library", "Открыть библиотеку", "Kitaphanany aç")} <UiIcon name="arrow-right" size={16} />
          </Link>
          <Link href="/" className="button ghost">
            {text("Go home", "На главную", "Baş sahypa")}
          </Link>
        </div>
      </div>
    </section>
  );
}
