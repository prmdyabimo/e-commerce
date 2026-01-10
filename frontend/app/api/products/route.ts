import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function GET(req: Request) {
  // Server-side proxy to backend to avoid CORS in browser
  const auth = req.headers.get("authorization");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth) headers["Authorization"] = auth;

  const proxiedUrl = `${BASE}/products`;
  const res = await fetch(proxiedUrl, { headers, cache: "no-store" });
  const body = await res.text();
  const contentType = res.headers.get("content-type") || "application/json";

  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": contentType },
  });
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    const headers: Record<string, string> = {};
    if (auth) headers["Authorization"] = auth;
    const requestContentType = req.headers.get("content-type");
    if (requestContentType) headers["Content-Type"] = requestContentType;
    const body = await req.arrayBuffer();
    const proxiedUrl = `${BASE}/products`;
    const res = await fetch(proxiedUrl, { method: "POST", headers, body });
    const text = await res.text();
    const contentType = res.headers.get("content-type") || "application/json";

    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } catch (err: unknown) {
    return NextResponse.json({ message: String(err) }, { status: 500 });
  }
}
