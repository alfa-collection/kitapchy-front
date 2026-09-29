import { NextRequest, NextResponse } from "next/server";

const backendUrl = (process.env.NEXT_PUBLIC_API_URL || "http://192.168.137.130:1337").replace(/\/$/, "");

/** Server-side proxy for the remote Strapi Books collection. */
export async function GET(request: NextRequest) {
  const target = new URL(`${backendUrl}/api/books`);
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value));

  try {
    const response = await fetch(target, { cache: "no-store" });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
    });
  } catch {
    return NextResponse.json(
      { error: "The remote book API is unavailable.", backend: backendUrl },
      { status: 502 },
    );
  }
}
