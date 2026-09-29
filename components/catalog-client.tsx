"use client";

import { useEffect, useMemo, useState } from "react";
import { getBooks } from "@/lib/api";
import { sampleBooks, type Book } from "@/lib/books";
import { BookCard } from "@/components/book-card";

export function CatalogClient({ featured = false }: { featured?: boolean }) {
  const [books, setBooks] = useState<Book[]>(sampleBooks); const [query, setQuery] = useState(""); const [level, setLevel] = useState("All levels"); const [connected, setConnected] = useState(false);
  useEffect(() => { getBooks().then(data => { if (data?.length) { setBooks(data); setConnected(true); } }).catch(() => undefined); }, []);
  const shown = useMemo(() => books.filter(book => (level === "All levels" || String(book.difficulty) === level) && `${book.name} ${book.authors_or_directors_id?.[0]?.name || ""}`.toLowerCase().includes(query.toLowerCase())), [books, level, query]);
  const result = featured ? shown.slice(0, 4) : shown;
  return <>{!featured && <><div className="catalog-controls"><label className="search"><span>⌕</span><input aria-label="Search books" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by title or author" /></label><div className="select-row"><span>Reading level</span>{["All levels", "1", "2", "3", "4"].map(item => <button key={item} onClick={() => setLevel(item)} className={level === item ? "selected" : ""}>{item === "All levels" ? item : `Level ${item}`}</button>)}</div></div><div className="catalog-note">{connected ? `${shown.length} books from your library` : "Showing sample books — start Strapi to load your library"}</div></>}
  <div className={`book-grid ${featured ? "featured-grid" : ""}`}>{result.map(book => <BookCard key={book.documentId || book.slug} book={book} />)}</div></>;
}
