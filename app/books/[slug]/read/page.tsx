"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { initialText, sampleBooks } from "@/lib/books";

export default function ReaderPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState("pride-and-prejudice"); const [playing, setPlaying] = useState(false); const [saved, setSaved] = useState(false);
  useEffect(() => { params.then(value => setSlug(value.slug)); }, [params]); const book = sampleBooks.find(item => item.slug === slug) || sampleBooks[0];
  return <main className="reader"><header className="reader-top"><Link href={`/books/${slug}`}>‹ Book details</Link><span>{book.name}</span><button aria-label="Reader options">☷</button></header><div className="reader-body"><article><h1>{book.authors_or_directors_id?.[0]?.name}. “{book.name}”</h1><h2>Chapter 1</h2>{initialText.map(([english], index) => <p key={english} className={index === 1 ? "highlighted" : ""}>{english}</p>)}</article><article className="translation"><h1>{book.name}</h1><h2>ГЛАВА I</h2>{initialText.map(([, russian], index) => <p key={russian} className={index === 1 ? "highlighted" : ""}>{russian}</p>)}</article></div><footer className="reader-controls"><button>▮◀</button><button onClick={() => setPlaying(!playing)} className="play">{playing ? "❚❚" : "▶"}</button><button>▶▮</button><div className="timeline"><div><i></i></div><span>Chapter 1</span></div><span className="time">00:18 / 11:33:44</span><button>☷</button><button>Aa</button><button onClick={() => setSaved(!saved)}>{saved ? "♥" : "⚙"}</button></footer></main>;
}
