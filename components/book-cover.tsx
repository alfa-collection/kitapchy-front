import { mediaUrl } from "@/lib/api";
import type { Book } from "@/lib/books";

export function BookCover({ book, className = "" }: { book: Book; className?: string }) {
  const image = mediaUrl(book.image?.formats?.small?.url || book.image?.url);
  const initials = book.name.split(" ").slice(0, 2).map(word => word[0]).join("");
  return <div className={`book-cover ${className}`} style={image ? { backgroundImage: `url(${image})` } : undefined}>{!image && <><div className="cover-kicker">ENGLISH LIBRARY</div><div className="cover-title">{book.name}</div><div className="cover-author">{book.authors_or_directors_id?.[0]?.name || "Classic edition"}</div><div className="cover-mark">{initials}</div></>}</div>;
}
