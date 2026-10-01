import { NextResponse } from "next/server";
import { proxyBackendRequest } from "../../../../lib/backend-proxy";

export async function GET(request: Request) {
  const id = new URL(request.url).pathname.split("/").filter(Boolean).at(-1);
  if (!id || !/^[1-9]\d*$/.test(id)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  return proxyBackendRequest(request, `/orders/${id}`);
}
