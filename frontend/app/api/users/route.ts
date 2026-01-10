import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth) headers["Authorization"] = auth;
  const proxiedUrl = `${BASE}/users`;
  const res = await fetch(proxiedUrl, { headers, cache: "no-store" });
  const body = await res.text();
  const contentType = res.headers.get("content-type") || "application/json";

  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": contentType },
  });
}
