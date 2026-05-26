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

export type OrderStatus =
  | "pending"
  | "paid"
  | "processed"
  | "shipped"
  | "completed"
  | "cancelled";

export type OrderItem = {
  id?: number;
  order_id?: number;
  product_id: number;
  quantity: number;
  price?: number;
  product?: Product;
};

export type Order = {
  id?: number;
  user_id?: number;
  total_price?: number;
  status?: OrderStatus | string;
  address: string;
  order_items?: OrderItem[];
  user?: User;
};

export type OrderInputItem = {
  product_id: number;
  quantity: number;
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
  const imageFormData = new FormData();
  imageFormData.append("image", payload.imageFile);

  const uploadRes = await fetch(`${API_ROOT}/upload`, {
    method: "POST",
    body: imageFormData,
  });

  const uploadBody = await parseResponse(uploadRes);

  if (!uploadRes.ok) {
    throw new Error(
      uploadBody?.error || uploadBody?.message || `Upload image failed: ${uploadRes.status}`,
    );
  }

  const imageUrl = uploadBody?.image_url;

  if (!imageUrl || typeof imageUrl !== "string") {
    throw new Error("Upload image failed: missing image_url");
  }

  const res = await fetch(`${API_ROOT}/products`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      name: payload.name,
      price: payload.price,
      stock: payload.stock,
      category_id: payload.category_id,
      description: payload.description ?? "",
      image: imageUrl,
    }),
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

export async function createUser(payload: {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
}): Promise<User> {
  const res = await fetch(`${API_ROOT}/users`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const body = await parseResponse(res);

  if (!res.ok) {
    throw new Error(body?.error || body?.message || "Create user failed");
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

// ===============================
// ORDERS
// ===============================

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`${API_ROOT}/orders`, {
    headers: getAuthHeaders(),
  });

  const body = await parseResponse(res);

  if (!res.ok) {
    throw new Error(
      body?.error || body?.message || `Fetch orders failed: ${res.status}`,
    );
  }

  return body as Order[];
}

export async function fetchOrderById(
  id: string | number,
): Promise<Order> {
  const numericId = typeof id === "number" ? id : Number(id);

  if (!Number.isFinite(numericId) || numericId <= 0) {
    throw new Error("Invalid order id");
  }

  const res = await fetch(`${API_ROOT}/orders/${numericId}`, {
    headers: getAuthHeaders(),
  });

  const body = await parseResponse(res);

  if (!res.ok) {
    throw new Error(
      body?.error || body?.message || `Fetch order failed: ${res.status}`,
    );
  }

  return body as Order;
}

export async function createOrder(payload: {
  address: string;
  items: OrderInputItem[];
}): Promise<Order> {
  const trimmedAddress = payload.address.trim();

  if (!trimmedAddress) {
    throw new Error("Address is required");
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error("Order items are required");
  }

  const res = await fetch(`${API_ROOT}/orders`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      address: trimmedAddress,
      items: payload.items,
    }),
  });

  const body = await parseResponse(res);

  if (!res.ok) {
    throw new Error(
      body?.error || body?.message || `Create order failed: ${res.status}`,
    );
  }

  return body as Order;
}
