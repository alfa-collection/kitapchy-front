"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { addDictionaryWord, getBook, getCurrentUser, listDictionaryEntries, listUserSubscriptions, restoreAuthToken } from "@/lib/api";
import { resolveAccountPlan } from "@/lib/account";
import { type Book } from "@/lib/books";

type Sentence = { id: string; text: string; translation: string; audio: string; begin: number; end: number; part?: number };
type TextFile = { sentences?: Sentence[] };
type BookManifest = { sentence_count?: number; audio_files?: Array<{ name: string; duration?: number }>; chapters?: Array<{ title?: string; start?: number; audio?: string; sentence_id?: string }> };
type TranslationLanguage = "ru" | "tr";
const translationLanguages: Record<TranslationLanguage, string> = { ru: "Russian", tr: "Turkish" };

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
const formatTime = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600); const minutes = Math.floor((safeSeconds % 3600) / 60); const remainder = safeSeconds % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}` : `${minutes}:${String(remainder).padStart(2, "0")}`;
};
// Keep text and audio behind the Next.js proxy.  It forwards range requests
// for audio and lets the browser load each small text_N.json part on demand.
const booksApiUrl = "/api/book-files";
const bookFileUrl = (folder: string, file: string) => `${booksApiUrl}/${encodeURIComponent(folder)}/${file.split("/").map(encodeURIComponent).join("/")}`;
const assetFolderAliases: Record<string, string> = {
  "doyle-the-red-headed-league": "arthur-conan-doyle-the-red-headed-league",
  "can-you-keep-a-secret": "sophie-kinsella-can-you-keep-a-secret",
};
const folderSlug = (value?: string) => value?.replace(/\.[a-z0-9]+$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function fetchTextPart(folder: string, part: number) {
  const response = await fetch(bookFileUrl(folder, `chunks/text_${part}.json`));
  // Chunk files are finite. A 404 is the expected signal that there are no
  // more pages to load, rather than a reader error.
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Unable to load the book text.");
  return ((await response.json() as TextFile).sentences || []).map((sentence) => ({ ...sentence, part }));
}

async function fetchManifest(folder: string) {
  const response = await fetch(bookFileUrl(folder, "manifest.json"));
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Unable to load book details.");
  return await response.json() as BookManifest;
}

async function translateWord(text: string, target: TranslationLanguage) {
  const response = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, target }) });
  const data = await response.json() as { translation?: string; error?: string };
  if (!response.ok || !data.translation) throw new Error(data.error || "Unable to translate this word.");
  return data.translation;
}

function ClickableText({ text, onWordClick }: { text: string; onWordClick: (word: string, target: HTMLElement) => void }) {
  return <>{text.split(/([A-Za-z]+(?:['’][A-Za-z]+)?)/g).map((part, index) => /^[A-Za-z]+(?:['’][A-Za-z]+)?$/.test(part) ? <button key={`${part}-${index}`} type="button" className="reader-word" onClick={(event) => { event.stopPropagation(); onWordClick(part, event.currentTarget); }}>{part}</button> : part)}</>;
}

function ReaderLoading({ title }: { title: string }) {
  return <section className="reader-loading-screen" role="status" aria-live="polite" aria-label="Loading book">
    <div className="loading-book" aria-hidden="true">
      <span className="loading-book-spine" />
      <Image className="loading-book-mark" src="/logo.png" alt="" width={450} height={450} />
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
  const [sentences, setSentences] = useState<Sentence[]>([]); const [nextPart, setNextPart] = useState(2); const [previousPart, setPreviousPart] = useState(0); const [hasMore, setHasMore] = useState(true); const [manifest, setManifest] = useState<BookManifest | null>(null);
  const [loadingPart, setLoadingPart] = useState(false); const [loadingPrevious, setLoadingPrevious] = useState(false); const [activeIndex, setActiveIndex] = useState(0); const [playing, setPlaying] = useState(false); const [showTranslations, setShowTranslations] = useState(true); const [volume, setVolume] = useState(0.8); const [error, setError] = useState(""); const [time, setTime] = useState(0); const [hoverTime, setHoverTime] = useState<number | null>(null); const [scrubTime, setScrubTime] = useState<number | null>(null); const [seekingTime, setSeekingTime] = useState<number | null>(null); const [isPro, setIsPro] = useState(false); const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [translationLanguage, setTranslationLanguage] = useState<TranslationLanguage>("ru"); const [word, setWord] = useState(""); const [wordTranslation, setWordTranslation] = useState(""); const [translationError, setTranslationError] = useState(""); const [translating, setTranslating] = useState(false); const [wordPosition, setWordPosition] = useState({ top: 0, left: 0 }); const [savedWords, setSavedWords] = useState<string[]>([]);
  const audio = useRef<HTMLAudioElement>(null); const readerBody = useRef<HTMLDivElement>(null); const sentenceNodes = useRef<Record<number, HTMLDivElement | null>>({}); const revealSentence = useRef(false); const partRequestInFlight = useRef(false); const prependScrollHeight = useRef<number | null>(null); const playingRef = useRef(false); const pendingSeekTime = useRef<number | null>(null); const hoverFrame = useRef<number | null>(null); const pendingHoverTime = useRef<number | null>(null); const active = sentences[activeIndex];
  const showSentenceInReader = (index: number) => {
    const reader = readerBody.current; const node = sentenceNodes.current[index];
    if (!reader || !node) return false;
    const readerBounds = reader.getBoundingClientRect(); const sentenceBounds = node.getBoundingClientRect();
    reader.scrollTo({ top: Math.max(0, reader.scrollTop + sentenceBounds.top - readerBounds.top - reader.clientHeight / 2 + sentenceBounds.height / 2), behavior: "smooth" });
    node.focus({ preventScroll: true });
    return true;
  };

  const loadNextPart = useCallback(async () => {
    if (!folder || loadingPart || partRequestInFlight.current || !hasMore) return;
    if (!isPro) { setPlaying(false); setUpgradeOpen(true); return; }
    partRequestInFlight.current = true;
    setLoadingPart(true);
    try {
      const part = await fetchTextPart(folder, nextPart);
      if (!part) setHasMore(false);
      else { setSentences((current) => [...current, ...part]); setNextPart((current) => current + 1); }
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load the book."); }
    finally { partRequestInFlight.current = false; setLoadingPart(false); }
  }, [folder, hasMore, isPro, loadingPart, nextPart]);

  useEffect(() => {
    let cancelled = false;
    params.then(async ({ slug: value }) => {
      setSlug(value); setError(""); setSentences([]); setActiveIndex(0); setFolder(""); setNextPart(2); setPreviousPart(0); setHasMore(true); setManifest(null);
      let proAccess = false;
      if (restoreAuthToken()) {
        try { const [currentUser, subscriptions] = await Promise.all([getCurrentUser(), listUserSubscriptions().catch(() => [])]); proAccess = resolveAccountPlan(currentUser, subscriptions) === "pro"; } catch { /* Guests and expired sessions use the free preview. */ }
      }
      if (!cancelled) setIsPro(proAccess);
      let resolvedBook: Book | null = null;
      try { resolvedBook = await getBook(value); }
      catch { /* The asset folder can still be tried from the URL slug below. */ }
      if (cancelled) return;
      setBook(resolvedBook || undefined);
      const folders = [
        assetFolderAliases[value], assetFolderAliases[resolvedBook?.slug || ""],
        folderSlug(resolvedBook?.image?.name), resolvedBook?.slug, folderSlug(resolvedBook?.name), value, value.replace(/^the-/, ""),
      ]
        .filter((item): item is string => Boolean(item))
        .filter((item, index, items) => items.indexOf(item) === index);
      for (const candidate of folders) {
        try {
          const storedPosition = (() => { try { return JSON.parse(localStorage.getItem(`kitapchy-reading:${value}`) || "null") as { part?: number; sentenceId?: string } | null; } catch { return null; } })();
          const startPart = proAccess ? Math.max(1, storedPosition?.part || 1) : 1;
          const firstPart = await fetchTextPart(candidate, startPart);
          if (firstPart?.length) {
            const details = await fetchManifest(candidate).catch(() => null);
            if (!cancelled) {
              const restoredIndex = Math.max(0, firstPart.findIndex((sentence) => sentence.id === storedPosition?.sentenceId));
              revealSentence.current = Boolean(storedPosition?.sentenceId);
              setFolder(candidate); setManifest(details); setSentences(firstPart); setNextPart(startPart + 1); setPreviousPart(startPart - 1); setHasMore(true);
              setActiveIndex(restoredIndex);
              try {
                const storedWords = JSON.parse(localStorage.getItem(`kitapchy-words:${value}`) || "[]");
                setSavedWords(Array.isArray(storedWords) ? storedWords.filter((item): item is string => typeof item === "string") : []);
              } catch { setSavedWords([]); }
            }
            return;
          }
        } catch (loadError) { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load the book."); return; }
      }
      if (!cancelled) setError("This book does not have readable text files yet.");
    });
    return () => { cancelled = true; };
  }, [params]);

  useEffect(() => {
    const sentence = sentences[activeIndex];
    if (slug && sentence) localStorage.setItem(`kitapchy-reading:${slug}`, JSON.stringify({ part: sentence.part || 1, sentenceId: sentence.id }));
  }, [activeIndex, sentences, slug]);
  useEffect(() => {
    const bookId = book?.id;
    if (!restoreAuthToken() || typeof bookId !== "number") return;
    listDictionaryEntries().then((entries) => {
      const words = entries.filter((entry) => entry.book?.id === bookId).map((entry) => entry.word.toLowerCase());
      if (words.length) setSavedWords((current) => [...new Set([...current, ...words])]);
    }).catch(() => undefined);
  }, [book?.id]);
  useEffect(() => {
    if (prependScrollHeight.current === null || !readerBody.current) return;
    readerBody.current.scrollTop += readerBody.current.scrollHeight - prependScrollHeight.current;
    prependScrollHeight.current = null;
  }, [sentences]);
  useEffect(() => {
    if (!revealSentence.current) return;
    if (showSentenceInReader(activeIndex)) revealSentence.current = false;
  }, [activeIndex, sentences.length]);

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
  useEffect(() => { if (audio.current) audio.current.volume = volume; }, [volume, active]);
  const loadPreviousPart = useCallback(async () => {
    if (!isPro || !folder || !previousPart || loadingPart || partRequestInFlight.current) return;
    partRequestInFlight.current = true; setLoadingPart(true); setLoadingPrevious(true);
    try {
      const part = await fetchTextPart(folder, previousPart);
      if (!part?.length) { setPreviousPart(0); return; }
      prependScrollHeight.current = readerBody.current?.scrollHeight || 0;
      setSentences((current) => [...part, ...current]); setActiveIndex((current) => current + part.length); setPreviousPart((current) => Math.max(0, current - 1));
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load the book."); }
    finally { partRequestInFlight.current = false; setLoadingPart(false); setLoadingPrevious(false); }
  }, [folder, isPro, loadingPart, previousPart]);
  const handleScroll = () => { const body = readerBody.current; if (!body) return; if (body.scrollTop < 160) void loadPreviousPart(); else if (body.scrollHeight - body.scrollTop - body.clientHeight < 600) void loadNextPart(); };
  const handleAudioTimeUpdate = (currentTime: number) => {
    setTime(currentTime);
  };
  const nextSentence = sentences[activeIndex + 1];
  const activeBegin = Number(active?.begin);
  const rawActiveEnd = Number(active?.end);
  const nextBegin = active && nextSentence && audioFile(active.audio) === audioFile(nextSentence.audio) ? Number(nextSentence.begin) : Number.NaN;
  // Alignment occasionally overlaps adjacent cues (and has a few invalid end
  // points). The next cue's start is the hard boundary for the current line.
  const sentenceEnd = [rawActiveEnd, Number.isFinite(nextBegin) ? nextBegin - 0.02 : Number.NaN]
    .filter((value) => Number.isFinite(value) && value > activeBegin + 0.03)
    .reduce((earliest, value) => Math.min(earliest, value), Number.POSITIVE_INFINITY);
  // `timeupdate` fires only a few times per second, which is late enough for
  // speech to bleed into the next sentence. Monitor the active cue per frame,
  // pause exactly at its end, then restart the following cue at its own start.
  useEffect(() => {
    if (!playing || !active) return;
    let frame = 0;
    const monitorSentenceEnd = () => {
      const player = audio.current;
      if (!player || player.paused) return;
      if (player.currentTime >= (Number.isFinite(sentenceEnd) ? sentenceEnd : activeBegin + 0.05) - 0.015) {
        player.pause();
        if (activeIndex < sentences.length - 1) selectSentence(activeIndex + 1, true);
        else { setPlaying(false); void loadNextPart(); }
        return;
      }
      frame = requestAnimationFrame(monitorSentenceEnd);
    };
    frame = requestAnimationFrame(monitorSentenceEnd);
    return () => cancelAnimationFrame(frame);
  }, [active, activeIndex, playing, sentences.length]);
  const title = book?.name || slug.replace(/-/g, " "); const author = book?.authors_or_directors_id?.[0]?.name;
  const audioTracks = manifest?.audio_files?.length ? manifest.audio_files : active ? [{ name: audioFile(active.audio), duration: sentences.at(-1)?.end || 0 }] : [];
  const currentTrackIndex = Math.max(0, audioTracks.findIndex((track) => track.name === audioFile(active?.audio || "")));
  const currentTrack = audioTracks[currentTrackIndex];
  const audioOffset = audioTracks.slice(0, currentTrackIndex).reduce((sum, track) => sum + (track.duration || 0), 0);
  const fullDuration = audioTracks.reduce((sum, track) => sum + (track.duration || 0), 0) || sentences.at(-1)?.end || 0;
  const previewLastSentence = sentences.filter((sentence) => (sentence.part || 1) === 1).at(-1);
  const previewTrackIndex = Math.max(0, audioTracks.findIndex((track) => track.name === audioFile(previewLastSentence?.audio || "")));
  const previewOffset = audioTracks.slice(0, previewTrackIndex).reduce((sum, track) => sum + (track.duration || 0), 0);
  const previewDuration = previewLastSentence ? previewOffset + previewLastSentence.end : fullDuration;
  const totalDuration = isPro ? fullDuration : previewDuration;
  const globalTime = audioOffset + time;
  const timelineValue = scrubTime ?? globalTime;
  const chapterAt = (position: number) => manifest?.chapters?.filter((chapter) => {
    const chapterTrackIndex = audioTracks.findIndex((track) => track.name === chapter.audio);
    const chapterPosition = audioTracks.slice(0, Math.max(0, chapterTrackIndex)).reduce((sum, track) => sum + (track.duration || 0), 0) + (chapter.start || 0);
    return chapterPosition <= position;
  }).at(-1) || manifest?.chapters?.[0];
  const currentChapter = chapterAt(globalTime);
  const hoveredChapter = hoverTime === null ? null : chapterAt(hoverTime);
  const seekTimeline = async (nextTime: number) => {
    const target = Math.max(0, Math.min(nextTime, totalDuration));
    let trackIndex = 0; let offset = 0;
    for (const [index, track] of audioTracks.entries()) {
      if (target <= offset + (track.duration || 0) || index === audioTracks.length - 1) { trackIndex = index; break; }
      offset += track.duration || 0;
    }
    const localTime = target - offset; const targetTrack = audioTracks[trackIndex];
    let availableSentences = sentences;
    let nextIndex = availableSentences.findIndex((sentence) => audioFile(sentence.audio) === targetTrack?.name && localTime <= sentence.end);
    // A jump may point to an unloaded text chunk. Load only as far as the requested
    // audio file, preserving the lightweight initial reader load.
    if (nextIndex < 0 && folder && hasMore && !partRequestInFlight.current) {
      partRequestInFlight.current = true; setLoadingPart(true);
      let partNumber = nextPart;
      try {
        while (nextIndex < 0) {
          const part = await fetchTextPart(folder, partNumber);
          if (!part) { setHasMore(false); break; }
          availableSentences = [...availableSentences, ...part]; partNumber += 1;
          nextIndex = availableSentences.findIndex((sentence) => audioFile(sentence.audio) === targetTrack?.name && localTime <= sentence.end);
        }
        setSentences(availableSentences); setNextPart(partNumber);
      } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load that part of the book."); }
      finally { partRequestInFlight.current = false; setLoadingPart(false); }
    }
    // A missing next chunk simply means this is the end of the available book.
    // Leave the reader at its current position without showing an error.
    if (nextIndex < 0) return;
    pendingSeekTime.current = localTime;
    setTime(localTime);
    revealSentence.current = true;
    if (nextIndex === activeIndex) {
      if (audio.current) audio.current.currentTime = localTime;
      pendingSeekTime.current = null;
      if (showSentenceInReader(nextIndex)) revealSentence.current = false;
    } else setActiveIndex(nextIndex);
  };
  const previewTimelineTime = (event: MouseEvent<HTMLInputElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    pendingHoverTime.current = Math.max(0, Math.min(totalDuration, ((event.clientX - bounds.left) / bounds.width) * totalDuration));
    if (hoverFrame.current !== null) return;
    hoverFrame.current = requestAnimationFrame(() => { setHoverTime(pendingHoverTime.current); hoverFrame.current = null; });
  };
  const clearTimelinePreview = () => {
    if (hoverFrame.current !== null) cancelAnimationFrame(hoverFrame.current);
    hoverFrame.current = null; pendingHoverTime.current = null; setHoverTime(null);
  };
  const commitTimelineSeek = () => {
    if (scrubTime === null) return;
    const target = scrubTime;
    setScrubTime(null);
    setSeekingTime(target);
    requestAnimationFrame(() => { void seekTimeline(target).finally(() => setSeekingTime(null)); });
  };
  const handleWordClick = async (selectedWord: string, target: HTMLElement) => {
    const bounds = target.getBoundingClientRect();
    setWordPosition({ top: Math.max(8, bounds.top - 8), left: Math.min(window.innerWidth - 130, Math.max(130, bounds.left + bounds.width / 2)) });
    setWord(selectedWord); setWordTranslation(""); setTranslationError(""); setTranslating(true);
    try { setWordTranslation(await translateWord(selectedWord, translationLanguage)); }
    catch (translationLoadError) { setTranslationError(translationLoadError instanceof Error ? translationLoadError.message : "Unable to translate this word."); }
    finally { setTranslating(false); }
  };
  const saveWord = async () => {
    if (!word) return;
    const normalizedWord = word.toLowerCase();
    if (savedWords.includes(normalizedWord)) return;
    const next = [...new Set([...savedWords, word.toLowerCase()])];
    setSavedWords(next); localStorage.setItem(`kitapchy-words:${slug}`, JSON.stringify(next));
    if (restoreAuthToken() && typeof book?.id === "number") await addDictionaryWord(normalizedWord, book.id).catch(() => undefined);
  };
  const audioSrc = active ? bookFileUrl(folder, `audio/${audioFile(active.audio)}`) : "";
  return <main className="reader"><div className="reader-orb reader-orb-one" /><div className="reader-orb reader-orb-two" />{seekingTime !== null && <div className="reader-seeking" role="status"><i /> Switching to <strong>{formatTime(seekingTime)}</strong>…</div>}{upgradeOpen && <div className="upgrade-backdrop" role="presentation" onMouseDown={() => setUpgradeOpen(false)}><section className="upgrade-modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-title" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="modal-close" aria-label="Close upgrade offer" onClick={() => setUpgradeOpen(false)}>×</button><span className="upgrade-mark">✦</span><p className="eyebrow">FREE PREVIEW COMPLETE</p><h2 id="upgrade-title">Keep the story going.</h2><p>You reached the end of the free chapter. Upgrade to Pro for every text part, full audio, translations, and saved books.</p><div className="upgrade-actions"><Link href="/profile#plans" className="button primary">See Pro plan <span>→</span></Link><button type="button" className="button ghost" onClick={() => setUpgradeOpen(false)}>Not now</button></div></section></div>}<header className="reader-top"><Link href={`/books/${slug}`} className="back-link"><Icon name="back" size={16} /> <span>Library</span></Link><div className="reader-book"><span className="reader-kicker">{currentChapter?.title || "Now reading"}</span><strong>{title}</strong></div><div className="reader-status"><i /> <span>{isPro ? "Pro · full book" : "Free preview"}</span></div></header><div ref={readerBody} className="reader-body" onScroll={handleScroll}>
    {error ? <p className="reader-message">{error}</p> : !sentences.length ? <ReaderLoading title={title} /> : <article className={`reading-pane paired-reader ${showTranslations ? "" : "translations-hidden"}`}><header className="reading-intro"><div><span className="reader-kicker">{book?.genre_id?.[0]?.name || "English reader"}</span><h1>{title}</h1>{author && <p>by {author}</p>}</div><div className="reader-utility"><span className="saved-word-count">{savedWords.length} saved words</span><label className="translation-language">Translate words to<select value={translationLanguage} onChange={(event) => { setTranslationLanguage(event.target.value as TranslationLanguage); setWord(""); setWordTranslation(""); setTranslationError(""); }}><option value="ru">Russian</option><option value="tr">Turkish</option></select></label></div></header>{word && <aside className="word-translation" role="status" style={{ top: wordPosition.top, left: wordPosition.left }}><span><b>{word}</b> · {translationLanguages[translationLanguage]}</span><strong>{translating ? "Translating…" : wordTranslation || translationError}</strong><button type="button" className="save-word" onClick={saveWord}>{savedWords.includes(word.toLowerCase()) ? "Saved" : "Save"}</button><button type="button" onClick={() => setWord("")} aria-label="Close translation">×</button></aside>}{loadingPrevious && <p className="reader-loading previous-loading">Loading previous passages…</p>}<div className="parallel-columns"><header className="parallel-headings"><span><i /> Original text</span><span><i /> {translationLanguages[translationLanguage]} translation</span></header><div className="sentence-list">{sentences.map((sentence, index) => <div key={sentence.id} ref={(node) => { sentenceNodes.current[index] = node; }} role="button" tabIndex={0} className={`sentence-pair ${index === activeIndex ? "highlighted" : ""}`} onClick={() => toggleSentencePlayback(index)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleSentencePlayback(index); } }} aria-label={`${index === activeIndex && playing ? "Pause" : "Play"} passage ${index + 1}`}><span className="sentence-play"><Icon name={index === activeIndex && playing ? "pause" : "play"} size={14} /></span><span className="sentence-number">{String(index + 1).padStart(2, "0")}</span><span className="original-text"><ClickableText text={sentence.text} onWordClick={handleWordClick} /></span><span className="translated-text">{sentence.translation || "Translation unavailable"}</span></div>)}</div></div>{loadingPart && !loadingPrevious && <p className="reader-loading">Loading more…</p>}</article>}
  </div>{active && folder && <audio ref={audio} preload="metadata" src={audioSrc} onTimeUpdate={(event) => handleAudioTimeUpdate(event.currentTarget.currentTime)} onError={() => { setPlaying(false); setError("Audio could not be loaded. Please try again."); }} />}<footer className="reader-controls"><div className="player-actions"><button onClick={() => selectSentence(activeIndex - 1)} disabled={!activeIndex} aria-label="Previous sentence"><Icon name="previous" /></button><button onClick={() => setPlaying((value) => !value)} className="play" disabled={!active} aria-label={playing ? "Pause" : "Play"}>{playing ? <Icon name="pause" size={22} /> : <Icon name="play" size={22} />}</button><button onClick={() => { if (activeIndex === sentences.length - 1) void loadNextPart(); else selectSentence(activeIndex + 1); }} disabled={!active || (activeIndex >= sentences.length - 1 && !hasMore)} aria-label="Next sentence"><Icon name="next" /></button></div><button type="button" className="translation-toggle" onClick={() => setShowTranslations((value) => !value)}>{showTranslations ? "Hide translation" : "Show translation"}</button><div className="timeline"><input aria-label="Reading progress" type="range" min="0" max={totalDuration || 1} step="0.01" value={Math.min(timelineValue, totalDuration)} onChange={(event) => setScrubTime(Number(event.currentTarget.value))} onPointerUp={commitTimelineSeek} onKeyUp={(event) => { if (["ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"].includes(event.key)) commitTimelineSeek(); }} onMouseMove={previewTimelineTime} onMouseLeave={clearTimelinePreview} />{hoverTime !== null && <output className="timeline-preview" style={{ left: `${totalDuration ? (hoverTime / totalDuration) * 100 : 0}%` }}>{hoveredChapter?.title && <b>{hoveredChapter.title}</b>}{formatTime(hoverTime)}</output>}<span>{currentChapter?.title || `Passage ${activeIndex + 1}`} <b>· {formatTime(timelineValue)} of {formatTime(totalDuration)}</b></span></div><label className="volume-control"><Icon name="sound" size={16} /><input aria-label="Volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => setVolume(Number(event.currentTarget.value))} /></label><div className="audio-time"><span>{formatTime(globalTime)} <b>/ {formatTime(totalDuration)}</b></span></div></footer></main>;
}
