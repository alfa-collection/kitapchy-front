"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookCover } from "@/components/book-cover";
import { BookCard } from "@/components/book-card";
import { BookNotFound } from "@/components/book-not-found";
import { Shell } from "@/components/shell";
import { addBookmark, getBook, getCurrentUser, getSimilarBooks, listBookmarks, listUserSubscriptions, restoreAuthToken } from "@/lib/api";
import { resolveAccountPlan } from "@/lib/account";
import { formatBookDuration, normalizeBookLevel, type Book } from "@/lib/books";
import { useLanguage } from "@/lib/language";
import { BookGridLoading, PageLoading } from "@/components/loading-state";
import { UiIcon } from "@/components/ui-icon";

export default function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const { text } = useLanguage();
  const [book, setBook] = useState<Book | undefined>();
  const [similarBooks, setSimilarBooks] = useState<Book[]>([]);
  const [similarLoaded, setSimilarLoaded] = useState(false);
  const [slug, setSlug] = useState(""); const [bookmarked, setBookmarked] = useState(false); const [bookmarkMessage, setBookmarkMessage] = useState(""); const [shareMessage, setShareMessage] = useState(""); const [savingBookmark, setSavingBookmark] = useState(false); const [readingProgress, setReadingProgress] = useState<number | null>(null); const [loaded, setLoaded] = useState(false); const [isPro, setIsPro] = useState(false);
  useEffect(() => { params.then(({ slug: value }) => { setSlug(value); try { const saved = JSON.parse(localStorage.getItem(`kitapchy-reading:${value}`) || "null") as { sentenceId?: string } | number | null; setReadingProgress(typeof saved === "object" && saved?.sentenceId ? 1 : typeof saved === "number" && saved > 0 ? saved : null); } catch { setReadingProgress(null); } getBook(value).then(data => setBook(data || undefined)).catch(() => setBook(undefined)).finally(() => setLoaded(true)); }); }, [params]);
  useEffect(() => { if (!restoreAuthToken()) return; Promise.all([getCurrentUser(), listUserSubscriptions().catch(() => [])]).then(([user, subscriptions]) => { const pro = resolveAccountPlan(user, subscriptions) === "pro"; setIsPro(pro); if (pro && book?.id) return listBookmarks().then(items => setBookmarked(items.some(item => item.id === book.id || item.slug === book.slug))); }).catch(() => undefined); }, [book?.id, book?.slug]);
  useEffect(() => {
    if (!book) return;
    const genreNames = book.genre_id?.map((item) => item.name).filter(Boolean) || [];
    setSimilarBooks([]);
    setSimilarLoaded(false);
    getSimilarBooks(genreNames, book.slug)
      .then((items) => setSimilarBooks(items.filter((item) => item?.slug && item.slug !== book.slug).slice(0, 4)))
      .catch(() => setSimilarBooks([]))
      .finally(() => setSimilarLoaded(true));
  }, [book]);
  useEffect(() => {
    const libraryLink = document.querySelector<HTMLAnchorElement>(
      '.book-crumbs a[href="/catalog"]',
    );
    if (!libraryLink) return;
    const returnToPreviousPage = (event: MouseEvent) => {
      event.preventDefault();
      if (window.history.length > 1) router.back();
      else router.push("/catalog");
    };
    libraryLink.addEventListener("click", returnToPreviousPage);
    return () => libraryLink.removeEventListener("click", returnToPreviousPage);
  }, [book, router]);
  const saveBookmark = async () => {
    if (bookmarked) return;
    if (!isPro) { setBookmarkMessage("Saving books is a Pro feature. Upgrade from your profile."); return; }
    if (!book?.id) { setBookmarkMessage("This book is not available to save yet."); return; }
    if (!restoreAuthToken()) { setBookmarkMessage("Sign in to save books."); return; }
    setSavingBookmark(true); setBookmarkMessage("");
    try { const result = await addBookmark(book.id); if (!result.success) throw new Error(); setBookmarked(true); setBookmarkMessage("Saved to your bookshelf."); }
    catch { setBookmarkMessage("We could not save this book. Please try again."); }
    finally { setSavingBookmark(false); }
  };
  const shareBook = async () => {
    if (!book) return;
    const url = window.location.href;
    setShareMessage("");
    try {
      if (navigator.share) {
        await navigator.share({ title: book.name, text: book.desc || text("Read this book on Kitapchy", "Прочитайте эту книгу в Kitapchy", "Bu kitaby Kitapchy-da okaň"), url });
        setShareMessage(text("Book shared.", "Книга отправлена.", "Kitap paýlaşyldy."));
        return;
      }
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else {
        const input = document.createElement("textarea");
        input.value = url; input.style.position = "fixed"; input.style.opacity = "0";
        document.body.appendChild(input); input.select(); document.execCommand("copy"); input.remove();
      }
      setShareMessage(text("Book link copied.", "Ссылка на книгу скопирована.", "Kitabyň salgysy göçürildi."));
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      setShareMessage(text("We couldn’t share this book.", "Не удалось поделиться книгой.", "Kitaby paýlaşyp bolmady."));
    }
  };
  if (!book) return <Shell><main className="book-view">{loaded ? <BookNotFound /> : <PageLoading label={text("Loading book…", "Загрузка книги…")} />}</main></Shell>;
  const author = book.authors_or_directors_id?.[0]?.name || "Jane Austen";
  const genre = book.genre_id?.[0]?.name || text("English classic", "Английская классика");
  const passages = book.segment_count || 25;
  const level = normalizeBookLevel(book.difficulty);
  const progressLabel = readingProgress ? text(`Continue at passage ${readingProgress + 1}`, `Продолжить с отрывка ${readingProgress + 1}`) : text("Start with the first passage", "Начать с первого отрывка");
  return <Shell><main className="book-view"><nav className="book-crumbs" aria-label="Breadcrumb"><Link href="/catalog">Library</Link><span>›</span><span>{genre}</span><span>›</span><strong>{book.name}</strong></nav><section className="book-hero"><div className="book-presentation"><div className="cover-aura" /><BookCover book={book} className="hero-book-cover" eager /><div className="book-progress-card"><div><span className="progress-icon"><UiIcon name="arrow-up-right" size={12} /></span><span>{readingProgress ? "Your place is saved" : "Ready when you are"}</span></div><strong>{progressLabel}</strong><div className="book-progress-line"><i style={{ width: readingProgress ? `${Math.min(90, Math.max(8, ((readingProgress + 1) / passages) * 100))}%` : undefined }} /></div></div></div><div className="book-intro"><p className="book-kicker"><span>{genre}</span><i /> {isPro ? "PRO READER" : "FREE PREVIEW"}</p><h1>{book.name}</h1><p className="book-byline">A guided reading experience by <span>{author}</span></p><p className="book-summary">{book.desc || "A remarkable story to read slowly, listen to carefully, and make your own."}</p><div className="book-actions"><Link href={`/books/${slug || book.slug}/read`} className="book-read-button"><span>{readingProgress ? "Continue reading" : "Begin reading"}</span><b><UiIcon name="arrow-right" size={15} /></b></Link><button type="button" className={`book-icon-button bookmark-button ${bookmarked ? "saved" : ""} ${!isPro ? "locked" : ""}`} onClick={() => void saveBookmark()} disabled={savingBookmark || bookmarked} aria-label={bookmarked ? "Book saved" : isPro ? "Save book" : "Saving requires Pro"}><UiIcon name={bookmarked ? "heart" : "bookmark"} size={20} /></button><button type="button" className="book-icon-button" onClick={() => void shareBook()} aria-label={text("Share book", "Поделиться книгой", "Kitaby paýlaş")}><UiIcon name="arrow-up-right" size={20} /></button></div>{bookmarkMessage && <p className="bookmark-message" role="status">{bookmarkMessage} {!isPro && <Link href="/profile#plans">See plans <UiIcon name="arrow-right" size={14} /></Link>}</p>}{shareMessage && <p className="bookmark-message" role="status">{shareMessage}</p>}<div className="book-reassurance"><span><UiIcon name="sparkle" size={14} /></span> {isPro ? "Full text, translation and audio included" : "First text part and matching audio included"}</div></div></section><section className="book-details" aria-label="Book details"><div><span className="detail-label">Reading level</span><strong>Level {level}</strong><span className="level-scale" aria-label={`Level ${level} of 3`}>{[1, 2, 3].map(item => <i className={item <= level ? "active" : ""} key={item} />)}</span></div><div><span className="detail-label">Listen & read</span><strong>{formatBookDuration(book.duration)}</strong><span className="detail-note">At your own pace</span></div><div><span className="detail-label">In this book</span><strong>{passages} <small>passages</small></strong><span className="detail-note">Short, focused lessons</span></div><div><span className="detail-label">First published</span><strong>{book.published || "—"}</strong><span className="detail-note">A lasting favorite</span></div></section>{(!similarLoaded || similarBooks.length > 0) && <section className="similar-books" aria-labelledby="similar-books-title"><div className="similar-books-heading"><div><p className="book-kicker">{text("MORE TO EXPLORE", "ЕЩЁ ДЛЯ ЧТЕНИЯ", "ÝENE-DE OKAŇ")}</p><h2 id="similar-books-title">{text("Similar books", "Похожие книги", "Meňzeş kitaplar")}</h2><p>{text(`More stories from ${genre} and related genres.`, `Другие истории в жанре «${genre}» и близких жанрах.`, `${genre} we ýakyn žanrlardaky başga hekaýalar.`)}</p></div><Link href="/catalog">{text("View full library", "Вся библиотека", "Ähli kitaphana")} <UiIcon name="arrow-right" size={15} /></Link></div>{!similarLoaded ? <BookGridLoading count={4} /> : <div className="book-grid similar-books-grid">{similarBooks.map((item) => <BookCard key={item.documentId || item.slug} book={item} />)}</div>}</section>}<section className="book-story"><div className="story-heading"><p className="book-kicker">THE READING EXPERIENCE</p><h2>A story made<br /><em>approachable.</em></h2></div><div className="story-copy"><p>Move through the text sentence by sentence, with helpful tools there when you want them — and quietly out of the way when you do not.</p></div><div className="learning-list"><article><span>01</span><div><h3>Read with confidence</h3><p>Original text and a clear translation sit side by side.</p></div></article><article><span>02</span><div><h3>Listen as you go</h3><p>Hear the story aloud and follow every sentence.</p></div></article><article><span>03</span><div><h3>Make it your own</h3><p>Save words and return to the parts that moved you.</p></div></article></div></section></main></Shell>;
}
