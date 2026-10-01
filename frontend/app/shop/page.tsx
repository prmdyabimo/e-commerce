"use client";

import Link from "next/link";
import Image from "next/image";
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

function normalizeProduct(
  product: Product,
): Omit<NormalizedProduct, "categoryId" | "categoryName"> | null {
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
  const [userRole, setUserRole] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("user_role");
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
    setUserRole(localStorage.getItem("user_role"));
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
          const rawCategory = rec.category;
          const nestedCategory =
            typeof rawCategory === "object" && rawCategory !== null
              ? (rawCategory as Record<string, unknown>)
              : null;
          const rawCategoryId =
            rec.category_id ??
            rec.categoryId ??
            rec.categoryID ??
            nestedCategory?.id ??
            nestedCategory?.ID;
          const parsedCategoryId =
            typeof rawCategoryId === "number"
              ? rawCategoryId
              : Number.parseFloat(String(rawCategoryId));
          const categoryId = Number.isFinite(parsedCategoryId) ? parsedCategoryId : 0;
          const categoryName =
            String(
              rec.category_name ??
                rec.categoryName ??
                nestedCategory?.name ??
                nestedCategory?.Name ??
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
        title: "Keranjang kosong",
        text: "Tambahkan minimal satu produk sebelum checkout.",
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
        title: "Pesanan berhasil dibuat",
        text: `Pesanan #${order.id ?? "-"} berhasil dibuat.`,
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

  async function logout() {
    const result = await Swal.fire({
      icon: "question",
      title: "Keluar dari akun?",
      showCancelButton: true,
      confirmButtonText: "Keluar",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    localStorage.removeItem("token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_role");
    setTokenAvailable(false);
    setUserRole(null);
    setCustomerName("Guest");
    setCart({});
    setLastOrder(null);
  }

  const heroProduct = normalizedProducts[0];

  return (
    <div data-theme={theme} className={pageClass}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <nav className={`${isDark ? "border-slate-800 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-900"} sticky top-3 z-30 flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-5 py-3 shadow-lg shadow-slate-950/10`}>
          <Link href="/shop" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M4 7h16l-1.5 13h-13L4 7Z" />
                <path d="M9 9V6a3 3 0 0 1 6 0v3" />
              </svg>
            </span>
            Gizmo<span className="text-blue-600">Hub</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a href="#home" className="text-blue-600">Beranda</a>
            <a href="#products" className={subtleTextClass}>Belanja</a>
            <a href="#categories" className={subtleTextClass}>Kategori</a>
            <a href="#benefits" className={subtleTextClass}>Layanan</a>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className={`rounded-xl p-2.5 ${isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"}`}
              aria-label={isDark ? "Gunakan tema terang" : "Gunakan tema gelap"}
            >
              {isDark ? "☀" : "☾"}
            </button>
            {tokenAvailable ? (
              <>
                <span className={`hidden text-xs sm:block ${subtleTextClass}`}>Hai, {customerName}</span>
                {userRole === "admin" && <Link href="/admin" className="hidden rounded-xl px-3 py-2 text-sm font-semibold sm:block">Admin</Link>}
                <button type="button" onClick={logout} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700">Keluar</button>
              </>
            ) : (
              <Link href="/login" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700">Masuk</Link>
            )}
            <a href="#checkout" className="relative flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 4h2l2.2 11h11.3L21 8H6" />
                <circle cx="10" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" />
              </svg>
              <span className="hidden sm:inline">Keranjang</span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-blue-700">{totalItems}</span>
            </a>
          </div>
        </nav>

        <section id="home" className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#071126] px-6 py-10 text-white shadow-xl shadow-blue-950/15 sm:px-10 lg:min-h-[360px] lg:px-14 lg:py-12">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_50%,rgba(37,99,235,0.36),transparent_42%),linear-gradient(110deg,#071126_5%,#0b1b39_60%,#071126)]" />
          <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="max-w-xl">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.26em] text-blue-400">Teknologi untuk hidup lebih baik</p>
              <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">Teknologi cerdas.<br /><span className="text-blue-400">Setiap hari lebih baik.</span></h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-slate-300 sm:text-base">Temukan gadget dan aksesori pilihan untuk bekerja, bermain, dan menikmati setiap momen.</p>
              <a href="#products" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/40 transition hover:bg-blue-500">
                Jelajahi produk <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="relative flex min-h-48 items-center justify-center lg:min-h-64">
              <div className="absolute h-56 w-56 rounded-full bg-blue-500/20 blur-3xl sm:h-72 sm:w-72" />
              {heroProduct ? (
                <div className="relative flex items-center justify-center gap-3 sm:gap-5">
                  {normalizedProducts.slice(0, 3).map((product, index) => (
                    <div key={product.id} className={`overflow-hidden rounded-3xl border border-white/10 bg-white/[0.08] p-2 shadow-2xl backdrop-blur-sm ${index === 1 ? "-translate-y-5 sm:-translate-y-8" : "translate-y-4"} ${index === 2 ? "hidden sm:block" : ""}`}>
                      <div className={`relative h-28 w-24 overflow-hidden rounded-2xl sm:h-40 sm:w-36`}>
                        <Image src={resolveImageUrl(product.image)} alt={product.name} fill sizes="(min-width: 640px) 144px, 96px" unoptimized className="object-cover" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative rounded-3xl border border-white/10 bg-white/[0.08] px-8 py-10 text-center text-sm text-slate-300">Produk pilihan segera hadir</div>
              )}
            </div>
          </div>
        </section>

        <section id="benefits" className={`${isDark ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-white"} grid grid-cols-2 gap-4 rounded-2xl border px-5 py-5 shadow-sm md:grid-cols-4`}>
          {[
            ["🚚", "Gratis ongkir", "Untuk pesanan pilihan"],
            ["↩", "30 hari retur", "Belanja tanpa khawatir"],
            ["◇", "Pembayaran aman", "Transaksi terlindungi"],
            ["♧", "Dukungan 24/7", "Kami siap membantu"],
          ].map(([icon, title, detail]) => (
            <div key={title} className="flex items-center gap-3">
              <span className="text-2xl text-blue-600">{icon}</span>
              <div><h2 className={`text-xs font-bold sm:text-sm ${baseTextClass}`}>{title}</h2><p className={`mt-0.5 text-[10px] sm:text-xs ${subtleTextClass}`}>{detail}</p></div>
            </div>
          ))}
        </section>

        <section id="categories" className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Jelajahi pilihan</p><h2 className={`mt-1 text-xl font-extrabold sm:text-2xl ${baseTextClass}`}>Belanja berdasarkan kategori</h2></div>
            <a href="#products" className="text-xs font-bold text-blue-600 sm:text-sm">Lihat produk →</a>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.slice(0, 4).map((category, index) => (
              <button key={category.id} onClick={() => { setCategoryFilter(String(category.id)); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }} className={`group flex min-h-24 items-center justify-between overflow-hidden rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-white"}`}>
                <div><span className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl ${["bg-blue-100 text-blue-700", "bg-violet-100 text-violet-700", "bg-cyan-100 text-cyan-700", "bg-amber-100 text-amber-700"][index]}`}>{["◉", "⌚", "▰", "✦"][index]}</span><h3 className={`text-sm font-bold ${baseTextClass}`}>{category.name}</h3><span className={`text-[11px] ${subtleTextClass}`}>Lihat koleksi</span></div>
                <span className="text-2xl text-blue-600 transition group-hover:translate-x-1">→</span>
              </button>
            ))}
            {categories.length === 0 && <p className={`col-span-full rounded-2xl border border-dashed p-5 text-sm ${subtleTextClass}`}>Kategori akan tampil di sini setelah ditambahkan.</p>}
          </div>
        </section>

        <section className="relative isolate overflow-hidden rounded-2xl bg-[#071126] px-6 py-7 text-white sm:px-9">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_50%,rgba(37,99,235,0.35),transparent_40%)]" />
          <div className="grid items-center gap-5 md:grid-cols-[1fr_auto]">
            <div><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-400">Setup lebih produktif</p><h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Upgrade ruang kerja, mulai dari gadget yang tepat.</h2><p className="mt-2 max-w-xl text-sm text-slate-300">Perangkat pilihan untuk fokus, kreativitas, dan hiburan di rumah.</p></div>
            <a href="#products" className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold transition hover:border-blue-400 hover:bg-blue-500/10">Temukan aksesori <span aria-hidden="true">→</span></a>
          </div>
        </section>

        <div className="grid gap-6">
          <section id="products" className="space-y-4">
            <div className={`${shellClass} rounded-[1.75rem] p-4 backdrop-blur sm:p-5`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Pilihan terbaik</p>
                  <h2 className={`mt-1 text-xl font-extrabold ${baseTextClass}`}>Produk pilihan</h2>
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
                    placeholder="Cari produk..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                  <select
                    className={isDark ? "rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none" : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"}
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">Semua kategori</option>
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
                    <option value="newest">Terbaru</option>
                    <option value="price-high">Harga tertinggi</option>
                    <option value="price-low">Harga terendah</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className={`${shellClass} rounded-[1.75rem] p-6 text-sm ${subtleTextClass}`}>
                Memuat produk...
              </div>
            ) : loadMessage ? (
              <div className={`${shellClass} flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] p-6 text-sm ${subtleTextClass}`}>
                <span>Katalog sementara tidak tersedia. Pastikan backend aktif, lalu coba lagi.</span>
                <button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">Coba lagi</button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className={`${shellClass} rounded-[1.75rem] p-6 text-sm ${subtleTextClass}`}>
                {loadMessage ? "Produk belum dapat dimuat. Periksa koneksi backend lalu coba lagi." : "Produk tidak ditemukan. Coba ubah kata kunci atau kategori."}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {filteredProducts.map((product) => {
                  const selectedQuantity = cart[product.id] || 0;
                  const remaining = Math.max(product.stock - selectedQuantity, 0);

                  return (
                    <article key={product.id} className={`${cardClass} rounded-2xl`}>
                      <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <Image
                          src={resolveImageUrl(product.image)}
                          alt={product.name}
                          fill
                          sizes="(min-width: 1536px) 20vw, (min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                          unoptimized
                          className="object-contain p-4 transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute left-3 top-3 rounded-md bg-blue-600 px-2 py-1 text-[10px] font-bold uppercase text-white">
                          {product.stock > 0 ? "Tersedia" : "Habis"}
                        </div>
                      </div>

                      <div className="space-y-4 p-4">
                        <div>
                          <h3 className={`line-clamp-1 text-sm font-bold ${baseTextClass}`}>
                            {product.name}
                          </h3>
                          <p className={`mt-1 line-clamp-2 text-sm ${subtleTextClass}`}>
                            {product.description || "No description provided."}
                          </p>
                        </div>

                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <div className={`text-base font-extrabold ${baseTextClass}`}>
                              Rp {formatNumber(product.price)}
                            </div>
                          </div>
                          <div className={`text-right text-[11px] ${subtleTextClass}`}>
                            Stok {formatNumber(remaining)}
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
                          <div className={`min-w-0 flex-1 text-center text-xs font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                            {selectedQuantity > 0 ? `${selectedQuantity} di keranjang` : "Tambah"}
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

          <aside id="checkout" className="grid gap-4 lg:grid-cols-2">
            <div className={`${secondaryCardClass} backdrop-blur`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className={`text-lg font-semibold ${baseTextClass}`}>Ringkasan pesanan</h2>
                  <p className={`text-sm ${subtleTextClass}`}>Periksa keranjang sebelum membuat pesanan.</p>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isDark ? "bg-indigo-950/40 text-indigo-300" : "bg-indigo-50 text-indigo-700"}`}>
                  {cartItems.length} produk
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className={`block text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Alamat pengiriman
                  </label>
                  <textarea
                    className={isDark ? "mt-2 min-h-28 w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 outline-none placeholder-slate-500 focus:border-indigo-400" : "mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none placeholder-slate-400 focus:border-indigo-200"}
                    placeholder="Nama jalan, kota, provinsi, kode pos"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                {cartItems.length === 0 ? (
                  <div className={`rounded-2xl border border-dashed p-4 text-sm ${isDark ? "border-slate-700 bg-slate-800/60 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                  Keranjang masih kosong. Tambahkan produk untuk melanjutkan.
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
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className={`rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.22)] ${isDark ? "bg-slate-950 text-white" : "bg-indigo-600 text-white"}`}>
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Total barang</span>
                    <span>{totalItems}</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Total harga</div>
                      <div className="text-2xl font-semibold">Rp {formatNumber(subtotal)}</div>
                    </div>
                    <button
                      className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={onCheckout}
                      disabled={submitting || cartItems.length === 0}
                    >
                      {submitting ? "Memproses..." : "Buat pesanan"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${secondaryCardClass} backdrop-blur`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className={`text-base font-semibold ${baseTextClass}`}>Pesanan terakhir</h3>
                  <p className={`text-sm ${subtleTextClass}`}>Ringkasan pesanan terbaru Anda.</p>
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
                    <span className={subtleTextClass}>ID pesanan</span>
                    <span className={`font-semibold ${baseTextClass}`}>#{lastOrder.id ?? "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={subtleTextClass}>Total</span>
                    <span className={`font-semibold ${baseTextClass}`}>Rp {formatNumber(lastOrder.total_price ?? 0)}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className={subtleTextClass}>Alamat</span>
                    <span className={`max-w-[14rem] text-right font-semibold ${baseTextClass}`}>{lastOrder.address}</span>
                  </div>
                </div>
              ) : (
                <div className={`mt-4 rounded-2xl border border-dashed p-4 text-sm ${isDark ? "border-slate-700 bg-slate-800/60 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                  Belum ada pesanan pada sesi ini.
                </div>
              )}
            </div>
          </aside>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="flex min-h-36 items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-blue-100 to-indigo-50 p-6 dark:from-slate-900 dark:to-blue-950">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">Koleksi terbaru</p><h2 className={`mt-2 max-w-xs text-xl font-extrabold ${baseTextClass}`}>Temukan perangkat generasi berikutnya</h2><a href="#products" className="mt-3 inline-block text-xs font-bold text-blue-700 dark:text-blue-300">Belanja sekarang →</a></div>
            <span className="text-5xl" aria-hidden="true">◉</span>
          </div>
          <div className="flex min-h-36 items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-50 to-slate-100 p-6 dark:from-slate-900 dark:to-slate-800">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">Terlaris</p><h2 className={`mt-2 max-w-xs text-xl font-extrabold ${baseTextClass}`}>Pilihan favorit para pecinta gadget</h2><a href="#products" className="mt-3 inline-block text-xs font-bold text-blue-700 dark:text-blue-300">Lihat produk →</a></div>
            <span className="text-5xl" aria-hidden="true">⌁</span>
          </div>
        </section>

        <footer className="overflow-hidden rounded-2xl bg-[#071126] text-white">
          <div className="flex flex-col gap-4 bg-blue-600 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-bold">Tetap terhubung dengan GizmoHub</h2><p className="text-xs text-blue-100">Kabar produk dan inspirasi teknologi terbaru.</p></div>
            <a href="#products" className="w-fit rounded-lg bg-[#071126] px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-900">Jelajahi koleksi</a>
          </div>
          <div className="grid gap-6 px-6 py-7 sm:grid-cols-2 lg:grid-cols-4">
            <div><Link href="/shop" className="text-lg font-extrabold">Gizmo<span className="text-blue-400">Hub</span></Link><p className="mt-2 max-w-xs text-xs leading-5 text-slate-400">Destinasi gadget pilihan untuk kebutuhan sehari-hari.</p></div>
            <div><h3 className="text-xs font-bold">Belanja</h3><a href="#products" className="mt-3 block text-xs text-slate-400 hover:text-white">Semua produk</a><a href="#categories" className="mt-2 block text-xs text-slate-400 hover:text-white">Kategori</a></div>
            <div><h3 className="text-xs font-bold">Layanan pelanggan</h3><p className="mt-3 text-xs text-slate-400">Dukungan belanja dan informasi pesanan tersedia melalui akun Anda.</p></div>
            <div><h3 className="text-xs font-bold">Akun</h3><Link href={tokenAvailable ? "/admin" : "/login"} className="mt-3 block text-xs text-slate-400 hover:text-white">{tokenAvailable ? "Dashboard" : "Masuk / Daftar"}</Link><a href="#checkout" className="mt-2 block text-xs text-slate-400 hover:text-white">Keranjang</a></div>
          </div>
          <div className="border-t border-white/10 px-6 py-3 text-center text-[10px] text-slate-500">© {new Date().getFullYear()} GizmoHub. Semua hak dilindungi.</div>
        </footer>
      </div>
    </div>
  );
}