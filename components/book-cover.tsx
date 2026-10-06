"use client";

import { mediaUrl } from "@/lib/api";
import type { Book } from "@/lib/books";
import { useLanguage } from "@/lib/language";

export function BookCover({
  book,
  className = "",
}: {
  book: Book;
  className?: string;
}) {
  const { text } = useLanguage();
  const image = mediaUrl(book.image?.formats?.small?.url || book.image?.url);
  const initials = book.name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
  return (
    <div className={`book-cover ${className}`}>
      {image ? (
        <img
          className="book-cover-image"
          src={image}
          alt={`${text("Cover of", "Обложка книги")} ${book.name}`}
        />
      ) : (
        <>
          <div className="cover-kicker">{text("ENGLISH LIBRARY", "АНГЛИЙСКАЯ БИБЛИОТЕКА")}</div>
          <div className="cover-title">{book.name}</div>
          <div className="cover-author">
            {book.authors_or_directors_id?.[0]?.name || text("Classic edition", "Классическое издание")}
          </div>
          <div className="cover-mark">{initials}</div>
        </>
      )}
    </div>
  );
}
