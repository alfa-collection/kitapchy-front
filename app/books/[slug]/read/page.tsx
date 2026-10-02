"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getBook } from "@/lib/api";
import { sampleBooks, type Book } from "@/lib/books";

type Sentence = { id: string; text: string; translation: string; audio: string; begin: number; end: number };
type TextFile = { sentences?: Sentence[] };

function Icon({ name, size = 18 }: { name: "back" | "previous" | "next" | "play" | "pause" | "sound"; size?: number }) {
  const paths = {
    back: <><path d="m15 18-6-6 6-6" /><path d="M9 12h12" /></>,
    previous: <><path d="M7 6v12" /><path d="m18 6-7 6 7 6V6Z" /></>,
    next: <><path d="M17 6v12" /><path d="m6 6 7 6-7 6V6Z" /></>,
    play: <path d="m8 5 11 7-11 7V5Z" fill="currentColor" stroke="none" />,
    pause: <><path d="M8 6v12" /><path d="M16 6v12" /></>,
    sound: <><path d="M5 10v4h3l4 3V7l-4 3H5Z" /><path d="M16 9.5a4 4 0 0 1 0 5" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const audioFile = (audio: string) => audio.split("/").at(-1) || "";
const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
// Keep text and audio behind the Next.js proxy.  It forwards range requests
// for audio and lets the browser load each small text_N.json part on demand.
const booksApiUrl = "/api/book-files";
const bookFileUrl = (folder: string, file: string) => `${booksApiUrl}/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;

async function fetchTextPart(folder: string, part: number) {
  const response = await fetch(bookFileUrl(folder, `text_${part}.json`));
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Unable to load the book text.");
  return (await response.json() as TextFile).sentences || [];
}

function ReaderLoading({ title }: { title: string }) {
  return <section className="reader-loading-screen" role="status" aria-live="polite" aria-label="Loading book">
    <div className="loading-book" aria-hidden="true">
      <span className="loading-book-spine" />
      <span className="loading-book-mark">k</span>
      <span className="loading-book-page loading-book-page-one" />
      <span className="loading-book-page loading-book-page-two" />
    </div>
    <p className="reader-loading-kicker">Preparing your reading room</p>
    <h1>{title || "Your book"}</h1>
    <p className="reader-loading-copy">Opening the first passages and getting the audio ready.</p>
    <div className="reader-loading-progress" aria-hidden="true"><i /></div>
  </section>;
}

export default function ReaderPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState(""); const [book, setBook] = useState<Book>(); const [folder, setFolder] = useState("");
  const [sentences, setSentences] = useState<Sentence[]>([]); const [nextPart, setNextPart] = useState(2); const [hasMore, setHasMore] = useState(true);
  const [loadingPart, setLoadingPart] = useState(false); const [activeIndex, setActiveIndex] = useState(0); const [playing, setPlaying] = useState(false); const [showTranslations, setShowTranslations] = useState(true); const [volume, setVolume] = useState(0.8); const [error, setError] = useState(""); const [time, setTime] = useState(0);
  const audio = useRef<HTMLAudioElement>(null); const readerBody = useRef<HTMLDivElement>(null); const partRequestInFlight = useRef(false); const playingRef = useRef(false); const pendingSeekTime = useRef<number | null>(null); const active = sentences[activeIndex];

  const loadNextPart = useCallback(async () => {
    if (!folder || loadingPart || partRequestInFlight.current || !hasMore) return;
    partRequestInFlight.current = true;
    setLoadingPart(true);
    try {
      const part = await fetchTextPart(folder, nextPart);
      if (!part) setHasMore(false);
      else { setSentences((current) => [...current, ...part]); setNextPart((current) => current + 1); }
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load the book."); }
    finally { partRequestInFlight.current = false; setLoadingPart(false); }
  }, [folder, hasMore, loadingPart, nextPart]);

  useEffect(() => {
    let cancelled = false;
    params.then(async ({ slug: value }) => {
      setSlug(value); setError(""); setSentences([]); setActiveIndex(0); setFolder(""); setNextPart(2); setHasMore(true);
      const fallback = sampleBooks.find((item) => item.slug === value);
      let resolvedBook = fallback;
      try { resolvedBook = (await getBook(value)) || fallback; }
      catch { /* Use the local sample metadata when the catalog API is unavailable. */ }
      if (cancelled) return;
      setBook(resolvedBook);
      const folders = [resolvedBook?.slug, resolvedBook?.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), value, value.replace(/^the-/, "")]
        .filter((item): item is string => Boolean(item))
        .filter((item, index, items) => items.indexOf(item) === index);
      for (const candidate of folders) {
        try {
          const firstPart = await fetchTextPart(candidate, 1);
          if (firstPart?.length) { if (!cancelled) { setFolder(candidate); setSentences(firstPart); } return; }
        } catch (loadError) { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load the book."); return; }
      }
      if (!cancelled) setError("This book does not have readable text files yet.");
    });
    return () => { cancelled = true; };
  }, [params]);

  const selectSentence = (index: number, shouldPlay = playing) => { const next = Math.max(0, Math.min(index, sentences.length - 1)); setActiveIndex(next); setTime(sentences[next]?.begin || 0); if (shouldPlay) setPlaying(true); };
  const toggleSentencePlayback = (index: number) => {
    if (index === activeIndex && playing) { setPlaying(false); return; }
    selectSentence(index, true);
  };
  useEffect(() => {
    const player = audio.current;
    if (!player || !active) return;
    const seekToSentence = () => {
      player.currentTime = pendingSeekTime.current ?? active.begin;
      pendingSeekTime.current = null;
      if (playingRef.current) player.play().catch(() => setPlaying(false));
    };
    player.addEventListener("loadedmetadata", seekToSentence, { once: true });
    if (player.readyState >= HTMLMediaElement.HAVE_METADATA) seekToSentence();
    return () => player.removeEventListener("loadedmetadata", seekToSentence);
  }, [active]);
  useEffect(() => {
    const player = audio.current;
    playingRef.current = playing;
    if (!player) return;
    if (!playing) { player.pause(); return; }
    player.play().catch(() => setPlaying(false));
  }, [playing]);
  const handleScroll = () => { const body = readerBody.current; if (body && body.scrollHeight - body.scrollTop - body.clientHeight < 600) void loadNextPart(); };
  const handleAudioTimeUpdate = (currentTime: number) => {
    setTime(currentTime);
    if (playing && active && currentTime >= active.end - 0.05) {
      if (activeIndex < sentences.length - 1) selectSentence(activeIndex + 1, true);
      else { setPlaying(false); void loadNextPart(); }
    }
  };
  const title = book?.name || slug.replace(/-/g, " "); const author = book?.authors_or_directors_id?.[0]?.name; const total = sentences.at(-1)?.end || 0;
  const seekTimeline = (nextTime: number) => {
    const target = Math.max(0, Math.min(nextTime, total));
    const nextIndex = Math.max(0, sentences.findIndex((sentence) => target <= sentence.end));
    pendingSeekTime.current = target;
    setTime(target);
    if (nextIndex === activeIndex) { if (audio.current) audio.current.currentTime = target; pendingSeekTime.current = null; }
    else setActiveIndex(nextIndex);
  };

  return <main className="reader"><div className="reader-orb reader-orb-one" /><div className="reader-orb reader-orb-two" /><header className="reader-top"><Link href={`/books/${slug}`} className="back-link"><Icon name="back" size={16} /> <span>Library</span></Link><div className="reader-book"><span className="reader-kicker">Now reading</span><strong>{title}</strong></div><div className="reader-status"><i /> <span>Focused reading</span></div></header><div ref={readerBody} className="reader-body" onScroll={handleScroll}>
    {error ? <p className="reader-message">{error}</p> : !sentences.length ? <ReaderLoading title={title} /> : <article className={`reading-pane paired-reader ${showTranslations ? "" : "translations-hidden"}`}><header className="reading-intro"><div><span className="reader-kicker">{book?.genre_id?.[0]?.name || "English reader"}</span><h1>{title}</h1>{author && <p>by {author}</p>}</div></header><div className="parallel-columns"><header className="parallel-headings"><span><i /> Original text</span><span><i /> Translation</span></header><div className="sentence-list">{sentences.map((sentence, index) => <button key={sentence.id} type="button" className={`sentence-pair ${index === activeIndex ? "highlighted" : ""}`} onClick={() => toggleSentencePlayback(index)} aria-label={`${index === activeIndex && playing ? "Pause" : "Play"} passage ${index + 1}`}><span className="sentence-play"><Icon name={index === activeIndex && playing ? "pause" : "play"} size={14} /></span><span className="sentence-number">{String(index + 1).padStart(2, "0")}</span><span className="original-text">{sentence.text}</span><span className="translated-text">{sentence.translation || "Translation unavailable"}</span></button>)}</div></div>{loadingPart && <p className="reader-loading">Loading more…</p>}</article>}
  </div>{active && folder && <audio ref={audio} preload="metadata" volume={volume} src={bookFileUrl(folder, audioFile(active.audio))} onTimeUpdate={(event) => handleAudioTimeUpdate(event.currentTarget.currentTime)} onError={() => { setPlaying(false); setError("Audio could not be loaded. Please try again."); }} />}<footer className="reader-controls"><div className="player-actions"><button onClick={() => selectSentence(activeIndex - 1)} disabled={!activeIndex} aria-label="Previous sentence"><Icon name="previous" /></button><button onClick={() => setPlaying((value) => !value)} className="play" disabled={!active} aria-label={playing ? "Pause" : "Play"}>{playing ? <Icon name="pause" size={22} /> : <Icon name="play" size={22} />}</button><button onClick={() => { if (activeIndex === sentences.length - 1) void loadNextPart(); else selectSentence(activeIndex + 1); }} disabled={!active || (activeIndex >= sentences.length - 1 && !hasMore)} aria-label="Next sentence"><Icon name="next" /></button></div><button type="button" className="translation-toggle" onClick={() => setShowTranslations((value) => !value)}>{showTranslations ? "Hide translation" : "Show translation"}</button><div className="timeline"><input aria-label="Reading progress" type="range" min="0" max={total || 1} step="0.01" value={Math.min(time, total)} onChange={(event) => seekTimeline(Number(event.currentTarget.value))} /><span>Passage {activeIndex + 1} <b>of {sentences.length}</b></span></div><label className="volume-control"><Icon name="sound" size={16} /><input aria-label="Volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => setVolume(Number(event.currentTarget.value))} /></label><div className="audio-time"><span>{formatTime(time)} <b>/ {formatTime(total)}</b></span></div></footer></main>;
}
