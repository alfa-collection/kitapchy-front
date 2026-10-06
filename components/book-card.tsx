import Link from "next/link";
import { BookCover } from "@/components/book-cover";
import { formatBookDuration, type Book } from "@/lib/books";
import { useLanguage } from "@/lib/language";

export function BookCard({ book }: { book: Book }) {
  const { text } = useLanguage();
  return (
    <Link href={`/books/${book.slug}`} className="book-card">
      <BookCover book={book} />
      <div className="card-meta">
        <span>{text("Level", "Уровень")} {book.difficulty || 1}</span>
        <span>{formatBookDuration(book.duration)}</span>
      </div>
      <h3>{book.name}</h3>
      <p>{book.authors_or_directors_id?.[0]?.name || text("English classic", "Английская классика")}</p>
    </Link>
  );
}
