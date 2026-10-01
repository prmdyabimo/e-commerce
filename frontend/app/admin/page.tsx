"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { fetchCategories, fetchOrders, fetchProducts } from "../../lib/api";

type Product = {
  id?: number;
  name: string;
  price: number;
  stock?: number;
  category?: { name?: string };
};

type Category = {
  id: number;
  name: string;
};

type Order = {
  id?: number;
  total_price?: number;
  status?: string;
  user?: { name?: string; email?: string };
};

const numberFormatter = new Intl.NumberFormat("id-ID");

function formatNumber(value: number) {
  return numberFormatter.format(Number.isFinite(value) ? value : 0);
}

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
    case "paid":
    case "processed":
      return "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";
    case "shipped":
      return "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300";
    case "cancelled":
      return "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300";
    default:
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
  }
}

export default function AdminIndex() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userName] = useState(() => {
    if (typeof window === "undefined") return "Admin";
    const email = localStorage.getItem("user_email") || "";
    return email.split("@")[0] || "Admin";
  });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const [productResult, categoryResult, orderResult] = await Promise.allSettled([
      fetchProducts(),
      fetchCategories(),
      fetchOrders(),
    ]);

    if (productResult.status === "fulfilled") setProducts(productResult.value);
    if (categoryResult.status === "fulfilled") setCategories(categoryResult.value);
    if (orderResult.status === "fulfilled") setOrders(orderResult.value);

    const failures = [productResult, categoryResult, orderResult].filter(
      (result) => result.status === "rejected",
    );
    if (failures.length > 0) {
      setLoadError("Sebagian data belum berhasil dimuat. Periksa koneksi backend lalu coba lagi.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  const totalStock = useMemo(
    () => products.reduce((sum, product) => sum + Math.max(product.stock ?? 0, 0), 0),
    [products],
  );
  const inventoryValue = useMemo(
    () => products.reduce((sum, product) => sum + product.price * Math.max(product.stock ?? 0, 0), 0),
    [products],
  );
  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + (order.total_price ?? 0), 0),
    [orders],
  );
  const lowStockProducts = useMemo(
    () => products.filter((product) => (product.stock ?? 0) <= 5).sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0)).slice(0, 5),
    [products],
  );
  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const stats = [
    {
      label: "Total produk",
      value: formatNumber(products.length),
      detail: "Produk dalam katalog",
      icon: "▦",
      color: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    },
    {
      label: "Stok tersedia",
      value: formatNumber(totalStock),
      detail: "Unit siap dijual",
      icon: "▤",
      color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    },
    {
      label: "Nilai inventori",
      value: `Rp ${formatNumber(inventoryValue)}`,
      detail: "Harga × stok saat ini",
      icon: "◇",
      color: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    },
    {
      label: "Total pesanan",
      value: formatNumber(orders.length),
      detail: `Pendapatan Rp ${formatNumber(totalRevenue)}`,
      icon: "🛒",
      color: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="relative isolate overflow-hidden rounded-3xl bg-[#071126] px-6 py-7 text-white shadow-lg shadow-blue-950/10 sm:px-8 sm:py-9">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_50%,rgba(37,99,235,0.4),transparent_42%)]" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">Ringkasan toko</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Selamat datang, {userName}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Pantau katalog, stok, dan pesanan terbaru toko Anda dari satu tempat.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/products" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500">Kelola produk</Link>
            <Link href="/shop" className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">Lihat toko →</Link>
          </div>
        </div>
      </section>

      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          <span>{loadError}</span>
          <button type="button" onClick={() => void loadDashboard()} className="rounded-lg bg-amber-900 px-3 py-2 text-xs font-bold text-white hover:bg-amber-800">Muat ulang</button>
        </div>
      )}

      <section aria-label="Statistik toko" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{loading ? "—" : stat.value}</p>
              </div>
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl ${stat.color}`} aria-hidden="true">{stat.icon}</span>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{stat.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Pesanan terbaru</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Aktivitas pesanan dari pelanggan</p>
            </div>
            <Link href="/admin/orders" className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">Semua pesanan →</Link>
          </div>
          {loading ? (
            <p className="p-5 text-sm text-slate-500 dark:text-slate-400">Memuat pesanan...</p>
          ) : recentOrders.length === 0 ? (
            <p className="p-5 text-sm text-slate-500 dark:text-slate-400">Belum ada pesanan.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentOrders.map((order, index) => {
                const status = order.status || "pending";
                return (
                  <div key={order.id ?? `order-${index}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Pesanan #{order.id ?? "—"}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{order.user?.name || order.user?.email || "Pelanggan"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusClass(status)}`}>{status}</span>
                      <span className="min-w-24 text-right text-sm font-bold text-slate-900 dark:text-white">Rp {formatNumber(order.total_price ?? 0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Perlu perhatian</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Produk dengan stok 5 unit atau kurang</p>
            </div>
            <Link href="/admin/products" className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">Inventori →</Link>
          </div>
          {loading ? (
            <p className="p-5 text-sm text-slate-500 dark:text-slate-400">Memuat inventori...</p>
          ) : lowStockProducts.length === 0 ? (
            <p className="p-5 text-sm text-slate-500 dark:text-slate-400">Tidak ada produk dengan stok rendah.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {lowStockProducts.map((product, index) => {
                const stock = Math.max(product.stock ?? 0, 0);
                return (
                  <div key={product.id ?? `${product.name}-${index}`} className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">{product.name.slice(0, 1).toUpperCase() || "P"}</span>
                      <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{product.name || "Produk tanpa nama"}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{product.category?.name || "Tanpa kategori"}</p></div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${stock === 0 ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"}`}>{stock} tersisa</span>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { href: "/admin/products", title: "Kelola produk", detail: `${formatNumber(products.length)} produk tercatat`, icon: "▦" },
          { href: "/admin/categories", title: "Atur kategori", detail: `${formatNumber(categories.length)} kategori aktif`, icon: "◈" },
          { href: "/admin/users", title: "Kelola pengguna", detail: "Akun pelanggan dan admin", icon: "♙" },
        ].map((action) => (
          <Link key={action.href} href={action.href} className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-lg text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">{action.icon}</span>
            <span><span className="block text-sm font-bold text-slate-900 dark:text-white">{action.title}</span><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{action.detail}</span></span>
            <span className="ml-auto text-blue-600 transition group-hover:translate-x-1 dark:text-blue-400">→</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
