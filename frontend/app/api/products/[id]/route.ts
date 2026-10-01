import { NextResponse } from "next/server";
import { proxyBackendRequest } from "../../../../lib/backend-proxy";

function productPath(request: Request) {
  const id = new URL(request.url).pathname.split("/").filter(Boolean).at(-1);
  if (!id || !/^[1-9]\d*$/.test(id)) return null;
  return `/products/${id}`;
}

function invalidIdResponse() {
  return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
}

export async function GET(request: Request) {
  const path = productPath(request);
  return path ? proxyBackendRequest(request, path) : invalidIdResponse();
}

export async function PUT(request: Request) {
  const path = productPath(request);
  return path ? proxyBackendRequest(request, path) : invalidIdResponse();
}

export async function DELETE(request: Request) {
  const path = productPath(request);
  return path ? proxyBackendRequest(request, path) : invalidIdResponse();
}
