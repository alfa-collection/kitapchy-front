"use client";

import { useEffect, useMemo, useState } from "react";
import { getBooks } from "@/lib/api";
import { type Book } from "@/lib/books";
import { BookCard } from "@/components/book-card";
import { useLanguage } from "@/lib/language";
import { BookGridLoading } from "@/components/loading-state";

export function CatalogClient({ featured = false }: { featured?: boolean }) {
  const { text } = useLanguage();
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All levels");
  const [genre, setGenre] = useState("All genres");
  const [page, setPage] = useState(1);
  const [connected, setConnected] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    getBooks()
      .then((data) => {
        setBooks(data || []);
        setConnected(true);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);
  const genres = useMemo(
    () =>
      [
        ...new Set(
          books
            .flatMap((book) => book.genre_id?.map((item) => item.name) || [])
            .filter(Boolean),
        ),
      ].sort(),
    [books],
  );
  const shown = useMemo(
    () =>
      books.filter(
        (book) =>
          (level === "All levels" || String(book.difficulty) === level) &&
          (genre === "All genres" ||
            book.genre_id?.some((item) => item.name === genre)) &&
          `${book.name} ${book.authors_or_directors_id?.[0]?.name || ""}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [books, level, genre, query],
  );
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(shown.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const result = featured
    ? shown.slice(0, 4)
    : shown.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const resetPage = (action: () => void) => {
    action();
    setPage(1);
  };
  return (
    <>
      {!featured && (
        <>
          <div className="catalog-controls">
            <label className="search">
              <span>⌕</span>
              <input
                aria-label={text("Search books", "Поиск книг")}
                value={query}
                onChange={(e) => resetPage(() => setQuery(e.target.value))}
                placeholder={text("Search by title or author", "Поиск по названию или автору")}
              />
            </label>
            <div className="select-row">
              <span>{text("Reading level", "Уровень чтения")}</span>
              {["All levels", "1", "2", "3", "4"].map((item) => (
                <button
                  key={item}
                  onClick={() => resetPage(() => setLevel(item))}
                  className={level === item ? "selected" : ""}
                >
                  {item === "All levels" ? text("All levels", "Все уровни") : `${text("Level", "Уровень")} ${item}`}
                </button>
              ))}
            </div>
            <label className="genre-filter">
              {text("Genre", "Жанр")}
              <select
                value={genre}
                onChange={(event) =>
                  resetPage(() => setGenre(event.target.value))
                }
              >
                <option value="All genres">{text("All genres", "Все жанры")}</option>
                {genres.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          {loaded && <div className="catalog-note">
            {connected
              ? text(`${shown.length} books from your library`, `${shown.length} книг в библиотеке`)
              : text("Unable to connect to your library", "Не удалось подключиться к библиотеке")}
          </div>}
        </>
      )}
      {!loaded ? <BookGridLoading count={featured ? 4 : 8} /> : !result.length ? (
        <p className="bookmark-empty">
          {connected
            ? text("No books found.", "Книги не найдены.")
            : text("Your library is unavailable right now.", "Библиотека сейчас недоступна.")}
        </p>
      ) : (
        <div className={`book-grid ${featured ? "featured-grid" : ""}`}>
          {result.map((book) => (
            <BookCard key={book.documentId || book.slug} book={book} />
          ))}
        </div>
      )}
      {!featured && pageCount > 1 && (
        <nav className="catalog-pagination" aria-label={text("Book pages", "Страницы книг")}>
          <button
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            {text("Previous", "Назад")}
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map(
            (item) => (
              <button
                key={item}
                onClick={() => setPage(item)}
                className={item === currentPage ? "active" : ""}
                aria-current={item === currentPage ? "page" : undefined}
              >
                {item}
              </button>
            ),
          )}
          <button
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === pageCount}
          >
            {text("Next", "Вперёд")}
          </button>
        </nav>
      )}
    </>
  );
}
