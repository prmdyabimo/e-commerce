import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function isValidId(id?: string) {
  return !!id && !Number.isNaN(Number(id));
}

type RouteParams = { id: string } | Promise<{ id: string }>;

export async function PUT(req: Request, { params }: { params: RouteParams }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }
    const auth = req.headers.get("authorization");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (auth) headers["Authorization"] = auth;

    const body = await req.text();
    const proxiedUrl = `${BASE}/users/${id}`;
    const res = await fetch(proxiedUrl, { method: "PUT", headers, body });
    const text = await res.text();
    const contentType = res.headers.get("content-type") || "application/json";

    return new NextResponse(text, { status: res.status, headers: { "Content-Type": contentType } });
  } catch (err: unknown) {
    return NextResponse.json({ message: String(err) }, { status: 500 });
  }
}
