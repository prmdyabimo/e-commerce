import { proxyBackendRequest } from "../../../../lib/backend-proxy";

export async function GET(request: Request) {
  const search = new URL(request.url).search;
  return proxyBackendRequest(request, `/admin/analytics${search}`);
}
