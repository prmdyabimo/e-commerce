"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  fetchProducts,
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
};

const numberFormatter = new Intl.NumberFormat("id-ID");
const ASSET_BASE = process.env.NEXT_PUBLIC_API_URL || "";
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
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const data = await fetchProducts();
    setProducts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, []);

  const normalizedProducts = products.map((p, idx) => {
    const rec = p as unknown as Record<string, unknown>;
    const rawId = rec.id ?? rec.ID;
    const parsedId =
      typeof rawId === "number" ? rawId : Number.parseFloat(String(rawId));
    const pid = Number.isFinite(parsedId) ? parsedId : undefined;
    const pprice = Number(rec.price ?? rec.Price ?? 0);
    const pstock = Number(rec.stock ?? rec.Stock ?? 0);
    const price = Number.isFinite(pprice) ? pprice : 0;
    const stock = Number.isFinite(pstock) ? pstock : 0;

    return {
      key: pid ?? `product-${idx}`,
      id: pid,
      name: String(rec.name ?? rec.Name ?? ""),
      price,
      stock,
      description: String(rec.description ?? rec.Description ?? ""),
      image: String(rec.image ?? rec.Image ?? ""),
    };
  });

  const totalStock = normalizedProducts.reduce((acc, item) => acc + item.stock, 0);
  const inventoryValue = normalizedProducts.reduce(
    (acc, item) => acc + item.price * item.stock,
    0
  );

  async function onCreate(payload: {
    name: string;
    price: number;
    description?: string;
    stock: number;
    imageFile: File;
  }) {
    try {
      await createProduct(payload);
      await load();
      setEditing(null);
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Produk berhasil dibuat.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("createProduct error", err);
      const message = err instanceof Error ? err.message : String(err);
      await Swal.fire({
        icon: "error",
        title: "Gagal membuat produk",
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
    }
  ) {
    try {
      const nid = typeof id === "number" ? id : Number(id);
      if (!Number.isFinite(nid) || nid <= 0) {
        console.error("Invalid product id for update", id);
        await Swal.fire({
          icon: "error",
          title: "Gagal memperbarui",
          text: "Id produk tidak valid.",
        });
        return;
      }
      await updateProduct(nid, payload);
      await load();
      setEditing(null);
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Produk berhasil diperbarui.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("updateProduct error", err);
      const message = err instanceof Error ? err.message : String(err);
      await Swal.fire({
        icon: "error",
        title: "Gagal memperbarui produk",
        text: message,
      });
    }
  }

  async function onDelete(id: string | number) {
    const confirmResult = await Swal.fire({
      title: "Hapus produk?",
      text: "Produk akan dinonaktifkan (soft delete).",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
    });
    if (!confirmResult.isConfirmed) return;
    try {
      // normalize and validate id
      const nid = typeof id === "number" ? id : Number(id);
      if (!Number.isFinite(nid) || nid <= 0) {
        console.error("Invalid product id for delete", id);
        await Swal.fire({
          icon: "error",
          title: "Gagal menghapus",
          text: "Id produk tidak valid.",
        });
        return;
      }
      setDeletingId(nid);
      await deleteProduct(nid);
      await load();
      setEditing(null);
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Produk berhasil dihapus.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("deleteProduct error", err);
      const message = err instanceof Error ? err.message : String(err);
      await Swal.fire({
        icon: "error",
        title: "Gagal menghapus produk",
        text: message,
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6 font-[var(--font-geist-sans)]">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm">
        <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-0 h-48 w-48 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Admin Dashboard
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Product Control Center
            </h1>
            <p className="text-sm text-slate-600">
              Kelola katalog, stok, dan visual produk agar tetap sinkron.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3">
              <p className="text-xs text-slate-500">Total Produk</p>
              <p className="text-lg font-semibold text-slate-900">
                {normalizedProducts.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3">
              <p className="text-xs text-slate-500">Stok Tersedia</p>
              <p className="text-lg font-semibold text-slate-900">
                {formatNumber(totalStock)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3">
              <p className="text-xs text-slate-500">Nilai Inventori</p>
              <p className="text-lg font-semibold text-slate-900">
                Rp {formatNumber(inventoryValue)}
              </p>
            </div>
            <button
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              onClick={() =>
                setEditing({
                  id: undefined,
                  name: "",
                  price: 0,
                  stock: 0,
                  image: "",
                  description: "",
                })
              }
            >
              + Produk Baru
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Daftar Produk
                </h3>
                <p className="text-xs text-slate-500">
                  Terakhir diperbarui saat Anda menyimpan perubahan.
                </p>
              </div>
              <button
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                onClick={() =>
                  setEditing({
                    id: undefined,
                    name: "",
                    price: 0,
                    stock: 0,
                    image: "",
                    description: "",
                  })
                }
              >
                + New
              </button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
              Loading products...
            </div>
          ) : normalizedProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
              Belum ada produk. Tambahkan produk pertama Anda.
            </div>
          ) : (
            <div className="space-y-3">
              {normalizedProducts.map((item) => {
                const imageUrl = resolveImageUrl(item.image);
                return (
                  <div
                    key={item.key}
                    className="group rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                          <img
                            src={imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {item.name || "Produk tanpa nama"}
                            </p>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                              {formatNumber(item.stock)} stok
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {item.description || "Belum ada deskripsi."}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                        <div className="rounded-xl bg-slate-900/5 px-3 py-1 text-sm font-semibold text-slate-900">
                          Rp {formatNumber(item.price)}
                        </div>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing({
                              id: item.id,
                              name: item.name,
                              price: item.price,
                              description: item.description,
                              stock: item.stock,
                              image: item.image,
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.id !== undefined && item.id !== null)
                              onDelete(item.id);
                          }}
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-fit rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm xl:sticky xl:top-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {editing?.id ? "Edit product" : "Create product"}
            </h3>
            <p className="text-xs text-slate-500">
              Lengkapi detail produk untuk tampil di katalog.
            </p>
          </div>
          <ProductForm
            key={editing?.id !== undefined ? String(editing?.id) : "new"}
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
