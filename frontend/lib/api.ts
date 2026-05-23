// lib/api.ts

// ===============================
// TYPES
// ===============================

export type Product = {
  id?: number;
  name: string;
  price: number;
  description?: string;
  stock?: number;
  image?: string;
  category_id?: number;
};

export type User = {
  id?: number;
  name?: string;
  email: string;
};

export type Category = {
  id: number;
  name: string;
};

// ===============================
// API ROOT
// ===============================

const API_ROOT = "http://localhost:8080";

// ===============================
// AUTH HEADERS
// ===============================

function getAuthHeaders(includeContentType = true) {
  const headers: Record<string, string> = {};

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  const token = localStorage.getItem("token");

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  headers["x-api-key"] = "my-secret-api-key-123";

  return headers;
}

// ===============================
// RESPONSE PARSER
// ===============================

async function parseResponse(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      return await res.json();
    }

    return await res.text();
  } catch {
    try {
      return await res.text();
    } catch {
      return null;
    }
  }
}

// ===============================
// PRODUCTS
// ===============================

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_ROOT}/products`, {
    headers: getAuthHeaders(),
  });

  const body = await parseResponse(res);

  if (!res.ok) {
    throw new Error(
      body?.error || body?.message || `Fetch products failed: ${res.status}`,
    );
  }

  return body as Product[];
}

export async function createProduct(payload: {
  name: string;
  price: number;
  description?: string;
  stock: number;
  category_id: number;
  imageFile: File;
}): Promise<Product> {
  const formData = new FormData();

  formData.append("name", payload.name);
  formData.append("price", String(payload.price));
  formData.append("stock", String(payload.stock));
  formData.append("category_id", String(payload.category_id));

  if (payload.description) {
    formData.append("description", payload.description);
  }

  formData.append("image", payload.imageFile);

  const res = await fetch(`${API_ROOT}/products`, {
    method: "POST",
    headers: getAuthHeaders(false),
    body: formData,
  });

  const body = await parseResponse(res);

  if (!res.ok) {
    throw new Error(
      body?.error || body?.message || `Create product failed: ${res.status}`,
    );
  }

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
    category_id: number;
  },
): Promise<Product> {
  const formData = new FormData();

  if (payload.name !== undefined) {
    formData.append("name", payload.name);
  }

  if (payload.price !== undefined) {
    formData.append("price", String(payload.price));
  }

  if (payload.stock !== undefined) {
    formData.append("stock", String(payload.stock));
  }

  formData.append("category_id", String(payload.category_id));

  if (payload.description !== undefined) {
    formData.append("description", payload.description);
  }

  if (payload.imageFile) {
    formData.append("image", payload.imageFile);
  }

  const res = await fetch(`${API_ROOT}/products/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(false),
    body: formData,
  });

  const body = await parseResponse(res);

  if (!res.ok) {
    throw new Error(
      body?.error || body?.message || `Update product failed: ${res.status}`,
    );
  }

  return body as Product;
}

export async function deleteProduct(
  id: string | number,
): Promise<{ success: boolean }> {
  if (id === undefined || id === null || String(id) === "undefined") {
    throw new Error("Invalid product id");
  }

  const res = await fetch(`${API_ROOT}/products/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const body = await parseResponse(res);

  if (!res.ok) {
    throw new Error(
      body?.error || body?.message || `Delete product failed: ${res.status}`,
    );
  }

  return body as { success: boolean };
}

// ===============================
// CATEGORIES
// ===============================

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_ROOT}/categories`, {
    headers: getAuthHeaders(),
  });

  const body = await parseResponse(res);

  if (!res.ok) {
    throw new Error(body?.error || body?.message || "Fetch categories failed");
  }

  return body as Category[];
}

export async function createCategory(payload: { name: string }): Promise<Category> {
  const res = await fetch(`${API_ROOT}/categories`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const body = await parseResponse(res);

  if (!res.ok) {
    throw new Error(body?.error || body?.message || "Create category failed");
  }

  return body as Category;
}

export async function updateCategory(
  id: string | number,
  payload: { name: string },
): Promise<Category> {
  const numericId = typeof id === "number" ? id : Number(id);

  if (!Number.isFinite(numericId) || numericId <= 0) {
    throw new Error("Invalid category id");
  }

  const res = await fetch(`${API_ROOT}/categories/${numericId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const body = await parseResponse(res);

  if (!res.ok) {
    throw new Error(body?.error || body?.message || "Update category failed");
  }

  return body as Category;
}

export async function deleteCategory(
  id: string | number,
): Promise<{ message: string }> {
  const numericId = typeof id === "number" ? id : Number(id);

  if (!Number.isFinite(numericId) || numericId <= 0) {
    throw new Error("Invalid category id");
  }

  const res = await fetch(`${API_ROOT}/categories/${numericId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const body = await parseResponse(res);

  if (!res.ok) {
    throw new Error(body?.error || body?.message || "Delete category failed");
  }

  return body as { message: string };
}

// ===============================
// USERS
// ===============================

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_ROOT}/users`, {
    headers: getAuthHeaders(),
  });

  const body = await parseResponse(res);

  if (!res.ok) {
    throw new Error(
      body?.error || body?.message || `Fetch users failed: ${res.status}`,
    );
  }

  return body as User[];
}

export async function updateUser(
  id: string | number,
  payload: {
    name?: string;
    email?: string;
  },
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

  if (!res.ok) {
    throw new Error(
      body?.error || body?.message || `Update user failed: ${res.status}`,
    );
  }

  return body as User;
}

// ===============================
// AUTH
// ===============================

export async function register(payload: {
  name: string;
  email: string;
  password: string;
}) {
  const res = await fetch(`${API_ROOT}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await parseResponse(res);

  if (!res.ok) {
    throw new Error(body?.error || body?.message || "Register failed");
  }

  return body;
}

export async function login(payload: { email: string; password: string }) {
  const res = await fetch(`${API_ROOT}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await parseResponse(res);

  if (!res.ok) {
    throw new Error(body?.error || body?.message || "Login failed");
  }

  return body;
}
