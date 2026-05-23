"use client";

import React, { useEffect, useMemo, useState } from "react";
import { fetchCategories, fetchProducts } from "../../lib/api";

type Product = {
  id?: number;
  name: string;
  price: number;
  description?: string;
  stock?: number;
  image?: string;
};

type Category = {
  id: number;
  name: string;
};

const numberFormatter = new Intl.NumberFormat("id-ID");

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "0";
  return numberFormatter.format(value);
}

export default function AdminIndex() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    const email = localStorage.getItem("user_email");
    if (email) {
      setUserName(email.split("@")[0] || "Admin");
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [productData, categoryData] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
        ]);
        setProducts(productData || []);
        setCategories(categoryData || []);
      } catch (err) {
        console.error("load dashboard data error", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const normalizedProducts = useMemo(() => {
    return products.map((p, idx) => {
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
  }, [products]);

  const totalStock = useMemo(
    () => normalizedProducts.reduce((acc, item) => acc + item.stock, 0),
    [normalizedProducts],
  );
  const inventoryValue = useMemo(
    () =>
      normalizedProducts.reduce((acc, item) => acc + item.price * item.stock, 0),
    [normalizedProducts],
  );

  const stats = [
    {
      label: "Total Produk",
      value: normalizedProducts.length,
      change: "+12% dari bulan lalu",
      trend: "up",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7l9-4 9 4-9 4-9-4Z" />
          <path d="M3 7v10l9 4 9-4V7" />
        </svg>
      ),
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Stok Tersedia",
      value: formatNumber(totalStock),
      change: "+8% dari bulan lalu",
      trend: "up",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 8h14v10H5z" />
          <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
        </svg>
      ),
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Nilai Inventori",
      value: `Rp ${formatNumber(inventoryValue)}`,
      change: "+15% dari bulan lalu",
      trend: "down",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12h16" />
          <path d="M8 16h8" />
          <path d="M6 6h12" />
        </svg>
      ),
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Total Kategori",
      value: categories.length,
      change: "+2 baru",
      trend: "up",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="7.5" cy="7.5" r="3.5" />
          <circle cx="16.5" cy="7.5" r="3.5" />
          <circle cx="12" cy="16.5" r="3.5" />
        </svg>
      ),
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Total Pesanan",
      value: 0,
      change: "+0% dari bulan lalu",
      trend: "up",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 5h2l2 11h11l2-7H7" />
          <circle cx="10" cy="19" r="1.5" />
          <circle cx="17" cy="19" r="1.5" />
        </svg>
      ),
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
  ];

  return (
    <div className="space-y-6 font-[var(--font-geist-sans)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Selamat datang kembali, {userName} 👋
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500">Dashboard / Overview</div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {loading ? "-" : stat.value}
                </div>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${stat.bg} ${stat.color} dark:bg-slate-800`}>
                {stat.icon}
              </div>
            </div>
            <div
              className={`mt-2 text-xs ${
                stat.trend === "down" ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {stat.trend === "down" ? "↓ " : "↑ "}
              {stat.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
