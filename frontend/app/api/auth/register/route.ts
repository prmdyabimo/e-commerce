import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const proxiedUrl = `${BASE}/register`;
    const res = await fetch(proxiedUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
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
