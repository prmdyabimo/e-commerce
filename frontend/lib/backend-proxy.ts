import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function proxyBackendRequest(
  request: Request,
  backendPath: string,
): Promise<NextResponse> {
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");

  if (authorization) headers.set("Authorization", authorization);
  if (contentType) headers.set("Content-Type", contentType);

  const method = request.method.toUpperCase();

  try {
    const body =
      method === "GET" || method === "HEAD"
        ? undefined
        : await request.arrayBuffer();
    const response = await fetch(`${BACKEND_URL}${backendPath}`, {
      method,
      headers,
      body,
      cache: "no-store",
    });
    const responseBody = await response.text();
    const responseHeaders = new Headers();
    const responseContentType = response.headers.get("content-type");
    if (responseContentType) {
      responseHeaders.set("Content-Type", responseContentType);
    }

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`Backend proxy failed for ${backendPath}:`, error);
    return NextResponse.json(
      {
        error:
          "Backend tidak terhubung. Jalankan server Go dan pastikan API_URL mengarah ke backend yang aktif.",
      },
      { status: 502 },
    );
  }
}
