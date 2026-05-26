"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  fetchCategories,
  createOrder,
  fetchProducts,
  type Order,
  type Product,
} from "../../lib/api";

type NormalizedProduct = {
  id: number;
  name: string;
  price: number;
  description: string;
  stock: number;
  image: string;
  categoryId: number;
  categoryName: string;
};

type Category = {
  id: number;
  name: string;
};

type CartState = Record<number, number>;

const numberFormatter = new Intl.NumberFormat("id-ID");
const ASSET_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const DEFAULT_IMAGE =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Crect width='160' height='160' rx='32' fill='%23E2E8F0'/%3E%3Cpath d='M40 104l26-34 28 36 18-22 28 34H40z' fill='%2394A3B8'/%3E%3Ccircle cx='60' cy='56' r='11' fill='%2394A3B8'/%3E%3C/svg%3E";

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

function normalizeProduct(product: Product): NormalizedProduct | null {
  const rec = product as unknown as Record<string, unknown>;
  const rawId = rec.id ?? rec.ID;
  const parsedId = typeof rawId === "number" ? rawId : Number.parseFloat(String(rawId));

  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    return null;
  }

  const rawPrice = Number(rec.price ?? rec.Price ?? 0);
  const rawStock = Number(rec.stock ?? rec.Stock ?? 0);

  return {
    id: parsedId,
    name: String(rec.name ?? rec.Name ?? "").trim() || "Untitled product",
    price: Number.isFinite(rawPrice) ? rawPrice : 0,
    stock: Number.isFinite(rawStock) ? rawStock : 0,
    description: String(rec.description ?? rec.Description ?? "").trim(),
    image: String(rec.image ?? rec.Image ?? "").trim(),
  };
}

export default function ShopPage() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("shop-theme") as "light" | "dark" | null) || "light";
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartState>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [address, setAddress] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState("newest");
  const [tokenAvailable, setTokenAvailable] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("token"));
  });
  const [customerName, setCustomerName] = useState(() => {
    if (typeof window === "undefined") return "Guest";
    const email = localStorage.getItem("user_email") || "";
    return email ? email.split("@")[0] || "Guest" : "Guest";
  });
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("user_email") || "";

    setTokenAvailable(Boolean(token));
    if (email) {
      setCustomerName(email.split("@")[0] || "Guest");
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setLoadMessage(null);

        const [productData, categoryData] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
        ]);

        setProducts(productData || []);
        setCategories(categoryData || []);
      } catch (err) {
        console.error("load shop products error", err);
        setLoadMessage(
          err instanceof Error ? err.message : "Failed to load products",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [tokenAvailable]);

  const categoryLookup = useMemo(
    () => new Map(categories.map((cat) => [cat.id, cat.name])),
    [categories],
  );

  const normalizedProducts = useMemo(
    () =>
      products
        .map((product) => {
          const normalized = normalizeProduct(product);
          if (!normalized) return null;

          const rec = product as unknown as Record<string, unknown>;
          const rawCategoryId =
            rec.category_id ?? rec.categoryId ?? rec.categoryID ?? rec.category?.id;
          const parsedCategoryId =
            typeof rawCategoryId === "number"
              ? rawCategoryId
              : Number.parseFloat(String(rawCategoryId));
          const categoryId = Number.isFinite(parsedCategoryId) ? parsedCategoryId : 0;
          const categoryName =
            String(
              rec.category_name ??
                rec.categoryName ??
                rec.category?.name ??
                rec.category?.Name ??
                categoryLookup.get(categoryId) ??
                "",
            ).trim();

          return {
            ...normalized,
            categoryId,
            categoryName,
          };
        })
        .filter((item): item is NormalizedProduct => Boolean(item)),
    [products, categoryLookup],
  );

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const base = normalizedProducts.filter((product) => {
      const categoryMatch =
        categoryFilter === "all" || String(product.categoryId) === categoryFilter;
      return (
        categoryMatch &&
        (!term ||
          product.name.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term))
      );
    });

    const sorted = [...base];
    if (sortFilter === "price-high") {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortFilter === "price-low") {
      sorted.sort((a, b) => a.price - b.price);
    } else {
      sorted.sort((a, b) => b.id - a.id);
    }

    return sorted;
  }, [normalizedProducts, search, categoryFilter, sortFilter]);

  const cartItems = useMemo(() => {
    return normalizedProducts
      .map((product) => ({
        ...product,
        quantity: cart[product.id] || 0,
      }))
      .filter((item) => item.quantity > 0);
  }, [normalizedProducts, cart]);

  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems],
  );

  const totalItems = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems],
  );

  const isDark = theme === "dark";
  const pageClass = isDark
    ? "min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.92),_rgba(2,6,23,1)_48%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8"
    : "min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.10),_transparent_36%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8";
  const shellClass = isDark
    ? "border border-slate-800/90 bg-slate-900/90 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
    : "border border-white/70 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]";
  const mutedPanelClass = isDark
    ? "border border-slate-700 bg-slate-800"
    : "border border-slate-200 bg-slate-50";
  const inputClass = isDark
    ? "w-full rounded-xl border border-slate-700 bg-slate-800 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder-slate-500 focus:border-indigo-400"
    : "w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none placeholder-slate-400 focus:border-indigo-200";
  const cardClass = isDark
    ? "group overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-900 shadow-[0_16px_40px_rgba(0,0,0,0.28)] transition hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(0,0,0,0.35)]"
    : "group overflow-hidden rounded-[1.5rem] border border-white/70 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.12)]";
  const secondaryCardClass = isDark
    ? "rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
    : "rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]";
  const subtleTextClass = isDark ? "text-slate-400" : "text-slate-500";
  const baseTextClass = isDark ? "text-slate-100" : "text-slate-900";

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("shop-theme", theme);
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  function updateQuantity(productId: number, nextQuantity: number) {
    setCart((prev) => {
      const sanitized = Math.max(0, Math.floor(nextQuantity));
      if (sanitized === 0) {
        const clone = { ...prev };
        delete clone[productId];
        return clone;
      }

      return { ...prev, [productId]: sanitized };
    });
  }

  function incrementQuantity(product: NormalizedProduct) {
    const current = cart[product.id] || 0;
    updateQuantity(product.id, Math.min(product.stock, current + 1));
  }

  async function onCheckout() {
    if (!tokenAvailable) {
      const result = await Swal.fire({
        icon: "warning",
        title: "Login required",
        text: "Silakan login dulu untuk membuat order.",
        showCancelButton: true,
        confirmButtonText: "Login",
        cancelButtonText: "Nanti",
      });

      if (result.isConfirmed) {
        window.location.href = "/login";
      }

      return;
    }

    if (!address.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Alamat belum diisi",
        text: "Tambahkan alamat pengiriman sebelum checkout.",
      });
      return;
    }

    if (cartItems.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "Cart kosong",
        text: "Tambahkan minimal satu product sebelum checkout.",
      });
      return;
    }

    const invalidStock = cartItems.find((item) => item.quantity > item.stock);
    if (invalidStock) {
      await Swal.fire({
        icon: "error",
        title: "Stok tidak cukup",
        text: `${invalidStock.name} hanya tersedia ${invalidStock.stock} item.`,
      });
      return;
    }

    try {
      setSubmitting(true);
      const order = await createOrder({
        address: address.trim(),
        items: cartItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      });

      setLastOrder(order);
      setCart({});
      setAddress("");

      await Swal.fire({
        icon: "success",
        title: "Order berhasil dibuat",
        text: `Order #${order.id ?? "-"} sudah terkirim ke backend.`,
        timer: 1800,
        showConfirmButton: false,
      });

      const freshProducts = await fetchProducts();
      setProducts(freshProducts || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await Swal.fire({
        icon: "error",
        title: "Gagal membuat order",
        text: message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div data-theme={theme} className={pageClass}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className={`${shellClass} overflow-hidden rounded-[2rem] p-6 backdrop-blur`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${isDark ? "border-indigo-900/60 bg-indigo-950/40 text-indigo-300" : "border-indigo-100 bg-indigo-50 text-indigo-700"}`}>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Storefront order flow
              </div>
              <div className="space-y-2">
                <h1 className={`${baseTextClass} text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl`}>
                  Order products without waiting for the backend team to finish the UI.
                </h1>
                <p className={`max-w-2xl text-sm leading-6 ${subtleTextClass} sm:text-base`}>
                  This page follows the shared order contract. Visitors can browse products, while logged-in users can submit orders with address and item quantities.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                {!tokenAvailable ? (
                  <>
                    <Link href="/login" className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-indigo-500">
                      Login
                    </Link>
                    <Link href="/register" className={`rounded-xl px-4 py-2 font-semibold transition ${isDark ? "border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                      Register
                    </Link>
                  </>
                ) : (
                  <button
                    className={`rounded-xl px-4 py-2 font-semibold transition ${isDark ? "border border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/50" : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"}`}
                    onClick={async () => {
                      const confirmResult = await Swal.fire({
                        icon: "question",
                        title: "Logout?",
                        text: "You will be signed out from this session.",
                        showCancelButton: true,
                        confirmButtonText: "Logout",
                        cancelButtonText: "Cancel",
                      });

                      if (!confirmResult.isConfirmed) return;

                      localStorage.removeItem("token");
                      localStorage.removeItem("user_email");
                      localStorage.removeItem("user_role");
                      setTokenAvailable(false);
                      setCustomerName("Guest");
                      setCart({});
                      setLastOrder(null);
                      window.location.href = "/shop";
                    }}
                  >
                    Logout
                  </button>
                )}

                <button
                  className={`inline-flex items-center justify-center rounded-xl px-3 py-2 font-semibold transition ${isDark ? "border border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                  onClick={toggleTheme}
                  type="button"
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                  title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDark ? (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                      <circle cx="12" cy="12" r="5" />
                      <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m6.08 0l4.24-4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m6.08 0l4.24 4.24" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[22rem] lg:grid-cols-1">
              <div className={`rounded-2xl px-4 py-3 shadow-sm ${isDark ? "bg-slate-950 text-white" : "bg-indigo-600 text-white"}`}>
                <div className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-slate-400" : "text-indigo-100"}`}>Customer</div>
                <div className="mt-1 text-lg font-semibold">{customerName}</div>
                <div className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-indigo-100"}`}>
                  {tokenAvailable ? "Ready to checkout" : "Login required for checkout"}
                </div>
              </div>
              <div className={`${mutedPanelClass} rounded-2xl px-4 py-3`}>
                <div className={`text-xs uppercase tracking-[0.2em] ${subtleTextClass}`}>Cart summary</div>
                <div className={`${baseTextClass} mt-1 text-lg font-semibold`}>{totalItems} items</div>
                <div className={`mt-1 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>Subtotal Rp {formatNumber(subtotal)}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.75fr)]">
          <section className="space-y-4">
            <div className={`${shellClass} rounded-[1.75rem] p-4 backdrop-blur sm:p-5`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className={`text-lg font-semibold ${baseTextClass}`}>Available products</h2>
                  <p className={`text-sm ${subtleTextClass}`}>Select products, adjust quantity, and submit a single order.</p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[28rem] sm:flex-row">
                  <div className="relative flex-1">
                  <span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${subtleTextClass}`}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20 20l-4-4" />
                    </svg>
                  </span>
                  <input
                    className={inputClass}
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                  <select
                    className={isDark ? "rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none" : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"}
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={String(category.id)}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className={isDark ? "rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none" : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"}
                    value={sortFilter}
                    onChange={(e) => setSortFilter(e.target.value)}
                  >
                    <option value="newest">Newest</option>
                    <option value="price-high">Price: High</option>
                    <option value="price-low">Price: Low</option>
                  </select>
                </div>
              </div>
            </div>

            {!tokenAvailable && loadMessage ? (
              <div className={`${shellClass} rounded-[1.75rem] p-6 text-sm ${subtleTextClass}`}>
                {loadMessage}
              </div>
            ) : null}

            {loading ? (
              <div className={`${shellClass} rounded-[1.75rem] p-6 text-sm ${subtleTextClass}`}>
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className={`${shellClass} rounded-[1.75rem] p-6 text-sm ${subtleTextClass}`}>
                No products found.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {filteredProducts.map((product) => {
                  const selectedQuantity = cart[product.id] || 0;
                  const remaining = Math.max(product.stock - selectedQuantity, 0);

                  return (
                    <article key={product.id} className={cardClass}>
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={resolveImageUrl(product.image)}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute left-3 top-3 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-white">
                          Stock {formatNumber(product.stock)}
                        </div>
                      </div>

                      <div className="space-y-4 p-4">
                        <div>
                          <h3 className={`text-base font-semibold ${baseTextClass}`}>
                            {product.name}
                          </h3>
                          <p className={`mt-1 line-clamp-2 text-sm ${subtleTextClass}`}>
                            {product.description || "No description provided."}
                          </p>
                        </div>

                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <div className={`text-xs uppercase tracking-[0.2em] ${subtleTextClass}`}>Price</div>
                            <div className={`text-lg font-semibold ${baseTextClass}`}>
                              Rp {formatNumber(product.price)}
                            </div>
                          </div>
                          <div className={`text-right text-xs ${subtleTextClass}`}>
                            Remaining {formatNumber(remaining)}
                          </div>
                        </div>

                        <div className={`flex items-center gap-2 rounded-2xl p-2 ${isDark ? "bg-slate-800/80" : "bg-slate-50"}`}>
                          <button
                            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                            onClick={() => updateQuantity(product.id, selectedQuantity - 1)}
                            disabled={selectedQuantity === 0}
                          >
                            -
                          </button>
                          <div className={`min-w-0 flex-1 text-center text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                            {selectedQuantity > 0 ? `${selectedQuantity} in cart` : "Add to cart"}
                          </div>
                          <button
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                            onClick={() => incrementQuantity(product)}
                            disabled={remaining === 0}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className={`${secondaryCardClass} backdrop-blur`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className={`text-lg font-semibold ${baseTextClass}`}>Checkout</h2>
                  <p className={`text-sm ${subtleTextClass}`}>Review your cart before submitting the order.</p>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isDark ? "bg-indigo-950/40 text-indigo-300" : "bg-indigo-50 text-indigo-700"}`}>
                  {cartItems.length} products
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className={`block text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Shipping address
                  </label>
                  <textarea
                    className={isDark ? "mt-2 min-h-28 w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 outline-none placeholder-slate-500 focus:border-indigo-400" : "mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none placeholder-slate-400 focus:border-indigo-200"}
                    placeholder="Example: Papua"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                {cartItems.length === 0 ? (
                  <div className={`rounded-2xl border border-dashed p-4 text-sm ${isDark ? "border-slate-700 bg-slate-800/60 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                    Your cart is empty. Add at least one product to continue.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className={`rounded-2xl border p-4 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className={`font-semibold ${baseTextClass}`}>{item.name}</div>
                            <div className={`mt-1 text-xs ${subtleTextClass}`}>
                              Rp {formatNumber(item.price)} x {item.quantity}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-semibold ${baseTextClass}`}>
                              Rp {formatNumber(item.price * item.quantity)}
                            </div>
                            <button
                              className={`mt-2 text-xs font-semibold ${isDark ? "text-rose-400 hover:text-rose-300" : "text-rose-600 hover:text-rose-700"}`}
                              onClick={() => updateQuantity(item.id, 0)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className={`rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.22)] ${isDark ? "bg-slate-950 text-white" : "bg-indigo-600 text-white"}`}>
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Total items</span>
                    <span>{totalItems}</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Total price</div>
                      <div className="text-2xl font-semibold">Rp {formatNumber(subtotal)}</div>
                    </div>
                    <button
                      className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={onCheckout}
                      disabled={submitting || cartItems.length === 0}
                    >
                      {submitting ? "Processing..." : "Place order"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${secondaryCardClass} backdrop-blur`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className={`text-base font-semibold ${baseTextClass}`}>Last order</h3>
                  <p className={`text-sm ${subtleTextClass}`}>The latest backend response will appear here.</p>
                </div>
                {lastOrder?.status && (
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isDark ? "bg-emerald-950/40 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}>
                    {lastOrder.status}
                  </span>
                )}
              </div>

              {lastOrder ? (
                <div className={`mt-4 space-y-3 rounded-2xl p-4 text-sm ${isDark ? "bg-slate-800/80" : "bg-slate-50"}`}>
                  <div className="flex items-center justify-between">
                    <span className={subtleTextClass}>Order ID</span>
                    <span className={`font-semibold ${baseTextClass}`}>#{lastOrder.id ?? "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={subtleTextClass}>Total</span>
                    <span className={`font-semibold ${baseTextClass}`}>Rp {formatNumber(lastOrder.total_price ?? 0)}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className={subtleTextClass}>Address</span>
                    <span className={`max-w-[14rem] text-right font-semibold ${baseTextClass}`}>{lastOrder.address}</span>
                  </div>
                </div>
              ) : (
                <div className={`mt-4 rounded-2xl border border-dashed p-4 text-sm ${isDark ? "border-slate-700 bg-slate-800/60 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                  No order has been created yet in this session.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}