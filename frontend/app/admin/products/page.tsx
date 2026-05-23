"use client";

import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  fetchProducts,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../../lib/api";
import ProductForm from "../../../components/ProductForm";

type Product = {
  id?: number;
  name: string;
  price: number;
  description?: string;
  stock?: number;
  image?: string;
  category_id?: number;
  category?: string;
};

type Category = {
  id: number;
  name: string;
};

const numberFormatter = new Intl.NumberFormat("id-ID");
const ASSET_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const DEFAULT_IMAGE =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Crect width='140' height='140' rx='28' fill='%23E2E8F0'/%3E%3Cpath d='M34 94l22-28 24 30 16-18 24 30H34z' fill='%2394A3B8'/%3E%3Ccircle cx='52' cy='50' r='10' fill='%2394A3B8'/%3E%3C/svg%3E";

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "0";
  return numberFormatter.format(value);
}

function resolveImageUrl(image?: string) {
  if (!image) return DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(image)) return image;
  if (!ASSET_BASE) return image;
  return image.startsWith("/") ? `${ASSET_BASE}${image}` : `${ASSET_BASE}/${image}`;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userName, setUserName] = useState("Admin");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    alt: string;
    name: string;
  } | null>(null);
  const emptyProduct: Product = {
    name: "",
    price: 0,
    stock: 0,
    description: "",
    image: "",
    category_id: 0,
  };

  useEffect(() => {
    const email = localStorage.getItem("user_email");
    if (email) {
      setUserName(email.split("@")[0] || "Admin");
    }
  }, []);

  async function load() {
    try {
      setLoading(true);

      const productData = await fetchProducts();
      const categoryData = await fetchCategories();

      setProducts(productData || []);
      setCategories(categoryData || []);
    } catch (err) {
      console.error("load data error", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, []);

  const categoryLookup = useMemo(
    () => new Map(categories.map((cat) => [cat.id, cat.name])),
    [categories],
  );

  const normalizedProducts = useMemo(() => {
    return products.map((p, idx) => {
      const rec = p as unknown as Record<string, unknown>;
      const categoryObject =
        typeof rec.category === "object" && rec.category !== null
          ? (rec.category as Record<string, unknown>)
          : null;
      const rawId = rec.id ?? rec.ID;
      const parsedId =
        typeof rawId === "number" ? rawId : Number.parseFloat(String(rawId));
      const pid = Number.isFinite(parsedId) ? parsedId : undefined;
      const pprice = Number(rec.price ?? rec.Price ?? 0);
      const pstock = Number(rec.stock ?? rec.Stock ?? 0);
      const price = Number.isFinite(pprice) ? pprice : 0;
      const stock = Number.isFinite(pstock) ? pstock : 0;
      const objectCategoryId = categoryObject
        ? categoryObject.id ?? categoryObject.ID
        : undefined;
      const rawCategoryId =
        rec.category_id ??
        rec.categoryId ??
        rec.categoryID ??
        objectCategoryId;
      const parsedCategoryId =
        typeof rawCategoryId === "number"
          ? rawCategoryId
          : Number.parseFloat(String(rawCategoryId));
      const categoryId = Number.isFinite(parsedCategoryId)
        ? parsedCategoryId
        : 0;
      const categoryString =
        typeof rec.category === "string" ? rec.category : "";
      const objectCategoryName = categoryObject
        ? String(categoryObject.name ?? categoryObject.Name ?? "")
        : "";
      const categoryName = String(
        rec.category_name ??
          rec.categoryName ??
          objectCategoryName ??
          categoryString ??
          "",
      ).trim();
      const fallbackCategory = categoryId
        ? categoryLookup.get(categoryId) || ""
        : "";

      return {
        key: pid ?? `product-${idx}`,
        id: pid,
        name: String(rec.name ?? rec.Name ?? ""),
        price,
        stock,
        description: String(rec.description ?? rec.Description ?? ""),
        image: String(rec.image ?? rec.Image ?? ""),
        categoryId,
        categoryLabel: categoryName || fallbackCategory,
      };
    });
  }, [products, categoryLookup]);

  const filteredProducts = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    const base = normalizedProducts.filter((item) => {
      const searchMatch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm);
      const categoryMatch =
        categoryFilter === "all" ||
        (item.categoryId && String(item.categoryId) === categoryFilter);
      const statusMatch = statusFilter === "all" || statusFilter === "active";
      return searchMatch && categoryMatch && statusMatch;
    });

    const sorted = [...base];
    if (sortFilter === "price-high") {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortFilter === "price-low") {
      sorted.sort((a, b) => a.price - b.price);
    } else {
      sorted.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
    }
    return sorted;
  }, [normalizedProducts, search, categoryFilter, sortFilter, statusFilter]);

  async function onCreate(payload: {
    name: string;
    price: number;
    description?: string;
    stock: number;
    imageFile: File;
    category_id: number;
  }) {
    try {
      await createProduct(payload);

      await load();

      setEditing(null);

      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Product created successfully.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("createProduct error", err);

      const message = err instanceof Error ? err.message : String(err);

      await Swal.fire({
        icon: "error",
        title: "Failed to create product",
        text: message,
      });
    }
  }

  async function onUpdate(
    id: string | number,
    payload: {
      name: string;
      price: number;
      description?: string;
      stock: number;
      imageFile?: File | null;
      category_id: number;
    },
  ) {
    try {
      const nid = typeof id === "number" ? id : Number(id);
      if (!Number.isFinite(nid) || nid <= 0) {
        console.error("Invalid product id for update", id);
        await Swal.fire({
          icon: "error",
          title: "Update failed",
          text: "Invalid product ID.",
        });
        return;
      }
      await updateProduct(nid, payload);
      await load();
      setEditing(null);
      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Product updated successfully.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("updateProduct error", err);
      const message = err instanceof Error ? err.message : String(err);
      await Swal.fire({
        icon: "error",
        title: "Failed to update product",
        text: message,
      });
    }
  }

  async function onDelete(id: string | number) {
    const confirmResult = await Swal.fire({
      title: "Delete product?",
      text: "The product will be deactivated (soft delete).",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });
    if (!confirmResult.isConfirmed) return;
    try {
      const nid = typeof id === "number" ? id : Number(id);
      if (!Number.isFinite(nid) || nid <= 0) {
        console.error("Invalid product id for delete", id);
        await Swal.fire({
          icon: "error",
          title: "Delete failed",
          text: "Invalid product ID.",
        });
        return;
      }
      setDeletingId(nid);
      await deleteProduct(nid);
      await load();
      setEditing(null);
      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Product deleted successfully.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("deleteProduct error", err);
      const message = err instanceof Error ? err.message : String(err);
      await Swal.fire({
        icon: "error",
        title: "Failed to delete product",
        text: message,
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6 font-[var(--font-geist-sans)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Welcome back, {userName} 👋
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Products</h1>
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500">Dashboard / Products</div>
      </div>

      <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Product List
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage all products in your catalog.
                </p>
              </div>
              <button
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                onClick={() =>
                  setEditing({
                    ...emptyProduct,
                    id: undefined,
                  })
                }
              >
                + Add Product
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[180px]">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-4-4" />
                  </svg>
                </span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                value={sortFilter}
                onChange={(e) => setSortFilter(e.target.value)}
              >
                <option value="newest">Sort: Newest</option>
                <option value="price-high">Price: Highest</option>
                <option value="price-low">Price: Lowest</option>
              </select>
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("all");
                  setSortFilter("newest");
                  setStatusFilter("all");
                }}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {loading ? (
              <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
                No products yet. Add your first product.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-tl-2xl rounded-tr-2xl">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                      <th className="px-4 py-3 font-medium">Stock</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredProducts.map((item) => {
                      const imageUrl = resolveImageUrl(item.image);
                      return (
                        <tr key={item.key} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                className="h-12 w-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                                onClick={() =>
                                  setPreviewImage({
                                    src: imageUrl,
                                    alt: item.name || "Product image",
                                    name: item.name || "Product image",
                                  })
                                }
                                title="View product image"
                              >
                                <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
                              </button>
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                  {item.name || "Unnamed product"}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {item.description || "No description"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {item.categoryLabel || "No category"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                            Rp {formatNumber(item.price)}
                          </td>
                          <td className="px-4 py-4 text-slate-700 dark:text-slate-300">{formatNumber(item.stock)}</td>
                          <td className="px-4 py-4">
                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                              Aktif
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                                onClick={() =>
                                  setEditing({
                                    id: item.id,
                                    name: item.name,
                                    price: item.price,
                                    description: item.description,
                                    stock: item.stock,
                                    image: item.image,
                                    category_id: item.categoryId,
                                  })
                                }
                              >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                </svg>
                              </button>
                              <button
                                className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-500 hover:text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400"
                                onClick={() => {
                                  if (item.id !== undefined && item.id !== null) onDelete(item.id);
                                }}
                                disabled={deletingId === item.id}
                              >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 6h18" />
                                  <path d="M8 6V4h8v2" />
                                  <path d="M6 6l1 14h10l1-14" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredProducts.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <div>
                  Showing 1 - {filteredProducts.length} of {normalizedProducts.length} products
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-md border border-slate-200 px-2 py-1 text-slate-500 dark:border-slate-700 dark:text-slate-300">
                    1
                  </button>
                  <button className="rounded-md border border-slate-200 px-2 py-1 text-slate-400 dark:border-slate-700 dark:text-slate-500">
                    2
                  </button>
                  <button className="rounded-md border border-slate-200 px-2 py-1 text-slate-400 dark:border-slate-700 dark:text-slate-500">
                    3
                  </button>
                </div>
              </div>
            )}
          </div>
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="mx-auto my-4 flex min-h-[calc(100vh-2rem)] w-full max-w-2xl items-center sm:my-6 sm:min-h-[calc(100vh-3rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[calc(100vh-2rem)] w-full overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:border dark:border-slate-800 dark:bg-slate-900 sm:max-h-[calc(100vh-3rem)] sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {editing?.id ? "Edit Product" : "Add New Product"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Complete the product information below.
                  </p>
                </div>
                <button
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  onClick={() => setEditing(null)}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6l-12 12" />
                  </svg>
                </button>
              </div>
              <ProductForm
                key={editing?.id !== undefined ? String(editing?.id) : "new"}
                initial={editing ? editing : undefined}
                onCancel={() => setEditing(null)}
                onCreate={onCreate}
                onUpdate={onUpdate}
                categories={categories}
              />
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {previewImage.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Product image preview</p>
              </div>
              <button
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={() => setPreviewImage(null)}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6l-12 12" />
                </svg>
              </button>
            </div>
            <div className="flex max-h-[75vh] items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
              <img
                src={previewImage.src}
                alt={previewImage.alt}
                className="max-h-[70vh] max-w-full rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
