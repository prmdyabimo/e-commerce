"use client";

import React, { useEffect, useState } from "react";
import { fetchProducts, createProduct, updateProduct, deleteProduct } from "../../../lib/api";
import ProductForm from "../../../components/ProductForm";

type Product = { id: string; name: string; price: number; description?: string };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);

  async function load() {
    setLoading(true);
    const data = await fetchProducts();
    setProducts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(payload: { name: string; price: number; description?: string }) {
    const created = await createProduct(payload);
    await load();
    setEditing(null);
  }

  async function onUpdate(id: string, payload: { name: string; price: number; description?: string }) {
    await updateProduct(id, payload);
    await load();
    setEditing(null);
  }

  async function onDelete(id: string) {
    if (!confirm("Delete product?")) return;
    await deleteProduct(id);
    await load();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Products</h3>
            <button className="text-sm text-blue-600" onClick={() => setEditing({ id: "", name: "", price: 0 })}>+ New</button>
          </div>
          {loading ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-sm text-slate-500">No products yet.</div>
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className="p-3 border rounded-md flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-slate-500">{p.description}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">${p.price}</div>
                    <button className="text-sm text-slate-600" onClick={() => setEditing(p)}>Edit</button>
                    <button className="text-sm text-red-600" onClick={() => onDelete(p.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-lg font-medium mb-2">{editing?.id ? "Edit product" : "Create product"}</h3>
          <ProductForm
            key={editing?.id || "new"}
            initial={editing ? editing : undefined}
            onCancel={() => setEditing(null)}
            onCreate={onCreate}
            onUpdate={onUpdate}
          />
        </div>
      </div>
    </div>
  );
}
