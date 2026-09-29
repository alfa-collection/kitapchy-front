import Link from "next/link";
import { BookCover } from "@/components/book-cover";
import type { Book } from "@/lib/books";

export function BookCard({ book }: { book: Book }) {
  return <Link href={`/books/${book.slug}`} className="book-card"><BookCover book={book} /><div className="card-meta"><span>Level {book.difficulty || 1}</span><span>{book.duration || "—"} h</span></div><h3>{book.name}</h3><p>{book.authors_or_directors_id?.[0]?.name || "English classic"}</p></Link>;
}
