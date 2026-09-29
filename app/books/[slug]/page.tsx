"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookCover } from "@/components/book-cover";
import { Shell } from "@/components/shell";
import { getBook } from "@/lib/api";
import { sampleBooks, type Book } from "@/lib/books";

export default function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const [book, setBook] = useState<Book | undefined>(); const [slug, setSlug] = useState("");
  useEffect(() => { params.then(({ slug: value }) => { setSlug(value); const fallback = sampleBooks.find(item => item.slug === value) || sampleBooks[0]; setBook(fallback); getBook(value).then(data => { if (data) setBook(data); }).catch(() => undefined); }); }, [params]);
  if (!book) return null;
  const author = book.authors_or_directors_id?.[0]?.name || "Jane Austen";
  return <Shell><main className="detail-page"><div className="breadcrumbs"><Link href="/catalog">Library</Link><span> / </span><span>{book.name}</span></div><section className="book-detail"><div className="detail-cover"><BookCover book={book} /><div className="reading-progress"><span>Continue reading</span><strong>Chapter 1</strong><div><i></i></div></div></div><div className="detail-copy"><p className="eyebrow">{book.genre_id?.[0]?.name || "ENGLISH CLASSIC"}</p><h1>{book.name}</h1><p className="author">by {author}</p><p className="description">{book.desc || "A remarkable story to read slowly, listen to carefully, and make your own."}</p><div className="detail-actions"><Link href={`/books/${slug || book.slug}/read`} className="button primary">Start reading <span>→</span></Link><button className="round-button" aria-label="Save book">♡</button><button className="round-button" aria-label="Share book">↗</button></div><dl className="facts"><div><dt>Reading level</dt><dd>Level {book.difficulty || 2} <span className="level-dots">●●○○</span></dd></div><div><dt>Estimated time</dt><dd>{book.duration || "—"} hours</dd></div><div><dt>Published</dt><dd>{book.published || "—"}</dd></div><div><dt>Lessons</dt><dd>{book.segment_count || 25} passages</dd></div></dl></div></section><section className="about-book"><p className="eyebrow">WHY READ THIS?</p><h2>Meet the book</h2><p>{book.desc || "Build your vocabulary through a story that has delighted readers for generations. Use the parallel translation when a phrase needs a little help, then return to the original with more confidence."}</p></section></main></Shell>;
}
