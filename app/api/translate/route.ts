import { NextRequest, NextResponse } from "next/server";

const supportedLanguages = new Set(["ru", "tr"]);
type MyMemoryResponse = { responseData?: { translatedText?: string }; responseDetails?: string };

const decodeHtml = (value: string) => value.replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code))).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

/** Uses MyMemory's free, no-key translation endpoint for single reader words. */
export async function POST(request: NextRequest) {
  let body: { text?: unknown; target?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid translation request." }, { status: 400 }); }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const target = typeof body.target === "string" ? body.target : "";
  if (!text || text.length > 100 || !/^[\p{L}'’-]+$/u.test(text) || !supportedLanguages.has(target)) return NextResponse.json({ error: "Invalid translation request." }, { status: 400 });
  try {
    const query = new URLSearchParams({ q: text, langpair: `en|${target}` });
    const response = await fetch(`https://api.mymemory.translated.net/get?${query}`, { cache: "no-store" });
    const data = await response.json() as MyMemoryResponse;
    const translation = data.responseData?.translatedText;
    if (!response.ok || !translation) return NextResponse.json({ error: data.responseDetails || "The translation service could not translate this word." }, { status: 502 });
    return NextResponse.json({ translation: decodeHtml(translation) });
  } catch { return NextResponse.json({ error: "The translation service is unavailable." }, { status: 502 }); }
}
