import { NextRequest, NextResponse } from "next/server";

const backendUrl = (process.env.NEXT_PUBLIC_API_URL || "http://192.168.137.130:1337").replace(/\/$/, "");
const assetPart = /^(?:text_\d+\.json|audio_\d+\.m4a)$/;

/** Proxies the reader assets in Strapi's public/books directory. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const [bookFolder, file, ...rest] = path;
  if (!bookFolder || !file || rest.length || !/^[a-z0-9-]+$/i.test(bookFolder) || !assetPart.test(file)) return NextResponse.json({ error: "Invalid book asset path." }, { status: 400 });
  try {
    const source = `${backendUrl}/books/${encodeURIComponent(bookFolder)}/${encodeURIComponent(file)}`;
    const response = await fetch(source, { headers: request.headers.has("range") ? { range: request.headers.get("range")! } : undefined, cache: "no-store" });
    const headers = new Headers();
    for (const header of ["content-type", "content-length", "content-range", "accept-ranges"]) { const value = response.headers.get(header); if (value) headers.set(header, value); }
    return new NextResponse(response.body, { status: response.status, headers });
  } catch { return NextResponse.json({ error: "Book assets are unavailable." }, { status: 502 }); }
}
