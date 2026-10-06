import { NextRequest, NextResponse } from "next/server";

// Book files are exposed by the nginx media server, not Strapi's application port.
// Keep this aligned with the browser API default and allow a private server-only URL.
const backendUrl = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://192.168.137.181").replace(/\/$/, "");
const bookFolder = /^[a-z0-9-]+$/i;
const bookAsset = /^(?:manifest\.json|chunks\/text_\d+\.json|audio\/\d+\.m4a)$/;

/** Proxies the reader assets in Strapi's public/books directory. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const [folder, ...assetParts] = path;
  const asset = assetParts.join("/");
  if (!folder || !asset || !bookFolder.test(folder) || !bookAsset.test(asset)) return NextResponse.json({ error: "Invalid book asset path." }, { status: 400 });
  try {
    const source = `${backendUrl}/books/${encodeURIComponent(folder)}/${asset.split("/").map(encodeURIComponent).join("/")}`;
    const response = await fetch(source, { headers: request.headers.has("range") ? { range: request.headers.get("range")! } : undefined, cache: "no-store" });
    const headers = new Headers();
    for (const header of ["content-type", "content-length", "content-range", "accept-ranges"]) { const value = response.headers.get(header); if (value) headers.set(header, value); }
    return new NextResponse(response.body, { status: response.status, headers });
  } catch { return NextResponse.json({ error: "Book assets are unavailable." }, { status: 502 }); }
}
