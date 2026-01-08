type Product = { id: string; name: string; price: number; description?: string };
type User = { id: string; name?: string; email: string };

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("/api/products");
  return res.json();
}

export async function createProduct(payload: { name: string; price: number; description?: string }): Promise<Product> {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateProduct(id: string, payload: { name: string; price: number; description?: string }): Promise<Product> {
  const res = await fetch(`/api/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteProduct(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
  return res.json();
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch("/api/users");
  return res.json();
}
