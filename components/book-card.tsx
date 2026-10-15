import Link from "next/link";
import type { ReactNode } from "react";
import { BookCover } from "@/components/book-cover";
import { formatBookDuration, normalizeBookLevel, type Book } from "@/lib/books";
import { useLanguage } from "@/lib/language";

export function BookCard({ book, action }: { book: Book; action?: ReactNode }) {
  const { text } = useLanguage();
  return (
    <article className="book-card-shell">
      <Link href={`/books/${book.slug}`} className="book-card">
        <BookCover book={book} />
        <div className="card-meta">
          <span>{text("Level", "Уровень")} {normalizeBookLevel(book.difficulty)}</span>
          <span>{formatBookDuration(book.duration)}</span>
        </div>
        <h3>{book.name}</h3>
        <p>{book.authors_or_directors_id?.[0]?.name || text("English classic", "Английская классика")}</p>
      </Link>
      {action}
    </article>
  );
}
