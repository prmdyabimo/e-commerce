import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function extractId(req: Request) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    return segments[segments.length - 1];
  } catch {
    return undefined;
  }
}

function isValidId(id?: string) {
  return !!id && !Number.isNaN(Number(id));
}

export async function GET(
  req: Request,
  _context: { params: { id?: string } }
) {
  const id = extractId(req);
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }
  const auth = req.headers.get("authorization");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth) headers["Authorization"] = auth;

  const proxiedUrl = `${BASE}/products/${id}`;
  const res = await fetch(proxiedUrl, {
    headers,
    cache: "no-store",
  });
  const body = await res.text();
  const contentType = res.headers.get("content-type") || "application/json";

  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": contentType },
  });
}

export async function PUT(
  req: Request,
  _context: { params: { id?: string } }
) {
  try {
    const id = extractId(req);
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }
    const auth = req.headers.get("authorization");
    const headers: Record<string, string> = {};
    if (auth) headers["Authorization"] = auth;
    const requestContentType = req.headers.get("content-type");
    if (requestContentType) headers["Content-Type"] = requestContentType;
    const body = await req.arrayBuffer();
    const proxiedUrl = `${BASE}/products/${id}`;
    const res = await fetch(proxiedUrl, {
      method: "PUT",
      headers,
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

export async function DELETE(
  req: Request,
  _context: { params: { id?: string } }
) {
  const id = extractId(req);
  if (!isValidId(id)) {
    console.error("[api/products/[id]] DELETE invalid id:", id);
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }
  const auth = req.headers.get("authorization");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth) headers["Authorization"] = auth;
  const proxiedUrl = `${BASE}/products/${id}`;
  const res = await fetch(proxiedUrl, {
    method: "DELETE",
    headers,
  });
  const text = await res.text();
  const contentType = res.headers.get("content-type") || "application/json";

  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": contentType },
  });
}
