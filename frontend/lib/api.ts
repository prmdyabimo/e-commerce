// Client API helpers that call the backend Go server.
// Uses NEXT_PUBLIC_API_URL when available, otherwise defaults to http://localhost:8080

type Product = {
  id?: number;
  name: string;
  price: number;
  description?: string;
  stock?: number;
  image?: string;
};
type User = { id?: number; name?: string; email: string };

// Use same-origin Next API routes (these proxy to backend server to avoid CORS)
const API_ROOT = "/api";

function getAuthHeaders(includeContentType = true) {
  const headers: Record<string, string> = {};
  if (includeContentType) headers["Content-Type"] = "application/json";
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function parseResponse(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) return await res.json();
    return await res.text();
  } catch {
    try {
      return await res.text();
    } catch {
      return null;
    }
  }
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_ROOT}/products`, {
    headers: getAuthHeaders(),
  });
  const body = await parseResponse(res);
  if (!res.ok)
    throw new Error(
      body?.error || body?.message || `Fetch products failed: ${res.status}`
    );
  return body as Product[];
}

export async function createProduct(payload: {
  name: string;
  price: number;
  description?: string;
  stock: number;
  imageFile: File;
}): Promise<Product> {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("price", String(payload.price));
  formData.append("stock", String(payload.stock));
  if (payload.description) formData.append("description", payload.description);
  formData.append("image", payload.imageFile);
  const res = await fetch(`${API_ROOT}/products`, {
    method: "POST",
    headers: getAuthHeaders(false),
    body: formData,
  });
  const body = await parseResponse(res);
  if (!res.ok)
    throw new Error(
      body?.error || body?.message || `Create product failed: ${res.status}`
    );
  return body as Product;
}

export async function updateProduct(
  id: string | number,
  payload: {
    name?: string;
    price?: number;
    description?: string;
    stock?: number;
    imageFile?: File | null;
  }
): Promise<Product> {
  const formData = new FormData();
  if (payload.name !== undefined) formData.append("name", payload.name);
  if (payload.price !== undefined)
    formData.append("price", String(payload.price));
  if (payload.stock !== undefined) formData.append("stock", String(payload.stock));
  if (payload.description !== undefined)
    formData.append("description", payload.description);
  if (payload.imageFile) formData.append("image", payload.imageFile);
  const res = await fetch(`${API_ROOT}/products/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(false),
    body: formData,
  });
  const body = await parseResponse(res);
  if (!res.ok)
    throw new Error(
      body?.error || body?.message || `Update product failed: ${res.status}`
    );
  return body as Product;
}

export async function deleteProduct(
  id: string | number
): Promise<{ success: boolean }> {
  // Defensive: ensure id is valid before calling API to avoid requests to /undefined
  if (id === undefined || id === null || String(id) === "undefined") {
    throw new Error("Invalid product id");
  }
  const res = await fetch(`${API_ROOT}/products/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const body = await parseResponse(res);
  if (!res.ok)
    throw new Error(
      body?.error || body?.message || `Delete product failed: ${res.status}`
    );
  return body as { success: boolean };
}

// The frontend has a small mock users API under /api/users — keep that behaviour for now.
export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_ROOT}/users`, { headers: getAuthHeaders() });
  const body = await parseResponse(res);
  if (!res.ok)
    throw new Error(
      body?.error || body?.message || `Fetch users failed: ${res.status}`
    );
  return body as User[];
}

export async function updateUser(
  id: string | number,
  payload: { name?: string; email?: string }
): Promise<User> {
  const numericId = typeof id === "number" ? id : Number(id);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    throw new Error("Invalid user id");
  }
  const res = await fetch(`${API_ROOT}/users/${numericId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const body = await parseResponse(res);
  if (!res.ok)
    throw new Error(
      body?.error || body?.message || `Update user failed: ${res.status}`
    );
  return body as User;
}
