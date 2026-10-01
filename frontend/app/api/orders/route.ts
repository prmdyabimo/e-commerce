import { proxyBackendRequest } from "../../../lib/backend-proxy";

export async function GET(request: Request) {
  return proxyBackendRequest(request, "/orders");
}

export async function POST(request: Request) {
  return proxyBackendRequest(request, "/orders");
}
