"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchSalesAnalytics, type SalesAnalytics } from "../../../lib/api";

const numberFormatter = new Intl.NumberFormat("id-ID");
const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
});
const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function formatCurrency(value: number) {
  return `Rp ${numberFormatter.format(value)}`;
}

function imageUrl(image: string) {
  if (/^https?:\/\//i.test(image)) return image;
  return `${apiBase.replace(/\/$/, "")}/${image.replace(/^\//, "")}`;
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00`));
}

export default function SalesAnalyticsPage() {
  const [days, setDays] = useState<7 | 30>(7);
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAnalytics(await fetchSalesAnalytics(days));
    } catch (loadError) {
      console.error("load sales analytics error", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Analisis penjualan gagal dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAnalytics(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAnalytics]);

  const chart = useMemo(() => {
    const sales = analytics?.daily_sales ?? [];
    const maxRevenue = Math.max(1, ...sales.map((item) => item.revenue));
    const points = sales.map((item, index) => {
      const x = sales.length <= 1 ? 360 : (index / (sales.length - 1)) * 680 + 20;
      const y = 158 - (item.revenue / maxRevenue) * 124;
      return { x, y };
    });
    const line = points.map((point) => `${point.x},${point.y}`).join(" ");
    const area = points.length
      ? `${points[0].x},178 ${line} ${points[points.length - 1].x},178`
      : "";
    return { maxRevenue, points, line, area };
  }, [analytics]);

  const cards = [
    {
      label: `Pendapatan ${days} hari`,
      value: formatCurrency(analytics?.summary.revenue ?? 0),
      detail: "Dari pesanan yang sudah dibayar",
      icon: "↗",
      color: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    },
    {
      label: "Total pesanan",
      value: numberFormatter.format(analytics?.summary.orders ?? 0),
      detail: `${numberFormatter.format(analytics?.summary.confirmed_orders ?? 0)} terkonfirmasi`,
      icon: "▤",
      color: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
    },
    {
      label: "Rata-rata pesanan",
      value: formatCurrency(
        analytics?.summary.confirmed_orders
          ? Math.round(
              analytics.summary.revenue / analytics.summary.confirmed_orders,
            )
          : 0,
      ),
      detail: "Nilai rata-rata pesanan terkonfirmasi",
      icon: "◇",
      color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    },
    {
      label: "Menunggu pembayaran",
      value: numberFormatter.format(analytics?.summary.pending_orders ?? 0),
      detail: `${numberFormatter.format(analytics?.summary.cancelled_orders ?? 0)} pesanan dibatalkan`,
      icon: "◷",
      color: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="relative isolate overflow-hidden rounded-3xl bg-[#071126] px-6 py-7 text-white shadow-lg shadow-blue-950/10 sm:px-8 sm:py-9">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_50%,rgba(37,99,235,0.4),transparent_42%)]" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
              Performa toko
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Analisis penjualan
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Pantau tren pendapatan, status pesanan, dan produk terlaris
              berdasarkan transaksi yang tercatat.
            </p>
          </div>
          <div
            aria-label="Rentang analisis"
            className="flex w-fit rounded-xl border border-white/15 bg-white/5 p-1"
          >
            {([7, 30] as const).map((range) => (
              <button
                key={range}
                type="button"
                aria-pressed={days === range}
                onClick={() => setDays(range)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  days === range
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                {range} hari
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200"
        >
          <span>Analisis tidak tersedia. {error}</span>
          <button
            type="button"
            onClick={() => void loadAnalytics()}
            className="rounded-lg bg-rose-700 px-3 py-2 text-xs font-bold text-white hover:bg-rose-800"
          >
            Coba lagi
          </button>
        </div>
      )}

      <section
        aria-label="Ringkasan penjualan"
        className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4"
      >
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {card.label}
                </p>
                <p className="mt-2 truncate text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {loading || !analytics ? "—" : card.value}
                </p>
              </div>
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ${card.color}`}
                aria-hidden="true"
              >
                {card.icon}
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {loading || !analytics ? "Memuat data..." : card.detail}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                Tren pendapatan
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {analytics
                  ? `${formatDate(analytics.start_date)} – ${formatDate(analytics.end_date)}`
                  : `Ringkasan ${days} hari terakhir`}
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              Hari ini termasuk
            </span>
          </div>
          {loading ? (
            <div className="mt-6 flex h-64 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
              Memuat tren penjualan...
            </div>
          ) : error ? (
            <div className="mt-6 flex h-64 items-center justify-center rounded-xl bg-slate-50 px-6 text-center text-sm text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
              Data grafik belum dapat dimuat.
            </div>
          ) : (
            <>
              <div className="mt-5 overflow-hidden">
                <svg
                  viewBox="0 0 720 205"
                  role="img"
                  aria-label={`Grafik pendapatan harian selama ${days} hari`}
                  className="h-56 w-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="sales-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity=".24" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[34, 76, 118, 160].map((y) => (
                    <line
                      key={y}
                      x1="20"
                      x2="700"
                      y1={y}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity=".09"
                      strokeDasharray="4 6"
                    />
                  ))}
                  {chart.area && (
                    <polygon points={chart.area} fill="url(#sales-fill)" />
                  )}
                  {chart.line && (
                    <polyline
                      points={chart.line}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {chart.points.map((point, index) => (
                    <circle
                      key={analytics?.daily_sales[index]?.date}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#fff"
                      stroke="#2563eb"
                      strokeWidth="3"
                    />
                  ))}
                </svg>
              </div>
              <div
                className="mt-1 grid gap-1 text-[10px] text-slate-500 dark:text-slate-400"
                style={{
                  gridTemplateColumns: `repeat(${analytics?.daily_sales.length ?? days}, minmax(0, 1fr))`,
                }}
              >
                {analytics?.daily_sales.map((item) => (
                  <span key={item.date} className="truncate text-center">
                    {formatDate(item.date)}
                  </span>
                ))}
              </div>
              {analytics?.summary.revenue === 0 && (
                <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                  Belum ada pendapatan terkonfirmasi pada rentang ini. Nilai
                  akan terisi setelah pesanan dibayar.
                </p>
              )}
            </>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h3 className="font-bold text-slate-900 dark:text-white">
            Ringkasan status
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Semua pesanan pada rentang terpilih
          </p>
          <div className="mt-6 space-y-5">
            {[
              {
                label: "Terkonfirmasi",
                value: analytics?.summary.confirmed_orders ?? 0,
                color: "bg-emerald-500",
                text: "text-emerald-600 dark:text-emerald-400",
              },
              {
                label: "Menunggu pembayaran",
                value: analytics?.summary.pending_orders ?? 0,
                color: "bg-amber-400",
                text: "text-amber-600 dark:text-amber-400",
              },
              {
                label: "Dibatalkan",
                value: analytics?.summary.cancelled_orders ?? 0,
                color: "bg-rose-500",
                text: "text-rose-600 dark:text-rose-400",
              },
            ].map((status) => {
              const total = analytics?.summary.orders ?? 0;
              const percentage = total
                ? Math.round((status.value / total) * 100)
                : 0;
              return (
                <div key={status.label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-600 dark:text-slate-300">
                      {status.label}
                    </span>
                    <span className={`font-bold ${status.text}`}>
                      {loading || !analytics
                        ? "—"
                        : numberFormatter.format(status.value)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${status.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-[10px] text-slate-400">
                    {loading || !analytics ? "—" : `${percentage}%`}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-7 rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/40">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">
              Cara hitung pendapatan
            </p>
            <p className="mt-1 text-xs leading-5 text-blue-700/80 dark:text-blue-300/80">
              Pesanan menunggu dan dibatalkan tidak dihitung sebagai pendapatan.
              Pesanan berstatus dibayar, diproses, dikirim, atau selesai dihitung.
            </p>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">
              Produk terlaris
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Berdasarkan jumlah unit pada pesanan terkonfirmasi
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Maksimal 10 produk
          </span>
        </div>
        {loading ? (
          <p className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">
            Memuat produk terlaris...
          </p>
        ) : error ? (
          <p className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">
            Data produk belum dapat dimuat.
          </p>
        ) : !analytics?.top_products.length ? (
          <div className="px-6 py-10 text-center">
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              Belum ada produk terjual
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Daftar ini akan terisi setelah ada pesanan berstatus dibayar atau
              diproses.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {analytics.top_products.map((product, index) => (
              <div
                key={product.product_id}
                className="flex flex-wrap items-center gap-3 px-5 py-3.5 sm:px-6"
              >
                <span className="w-6 text-xs font-bold text-slate-400">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                  {product.image && (
                    <Image
                      src={imageUrl(product.image)}
                      alt=""
                      fill
                      sizes="48px"
                      unoptimized
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {product.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {numberFormatter.format(product.quantity)} unit terjual
                  </p>
                </div>
                <p className="ml-auto text-sm font-bold text-slate-900 dark:text-white">
                  {formatCurrency(product.revenue)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
