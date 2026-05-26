"use client";

import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  fetchOrderById,
  fetchOrders,
  type Order,
  type OrderItem,
} from "../../../lib/api";

type NormalizedOrder = {
  key: string;
  id: number;
  userId: number | null;
  userLabel: string;
  totalPrice: number;
  status: string;
  address: string;
  itemCount: number;
  items: OrderItem[];
  raw: Order;
};

const numberFormatter = new Intl.NumberFormat("id-ID");

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "0";
  return numberFormatter.format(value);
}

function normalizeOrder(order: Order, fallbackKey: string): NormalizedOrder | null {
  const rec = order as unknown as Record<string, unknown>;
  const rawId = rec.id ?? rec.ID;
  const parsedId = typeof rawId === "number" ? rawId : Number.parseFloat(String(rawId));

  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    return null;
  }

  const rawUserId = rec.user_id ?? rec.userID ?? rec.userId;
  const parsedUserId =
    typeof rawUserId === "number"
      ? rawUserId
      : Number.parseFloat(String(rawUserId));
  const userId = Number.isFinite(parsedUserId) ? parsedUserId : null;

  const total = Number(rec.total_price ?? rec.totalPrice ?? rec.TotalPrice ?? 0);
  const status = String(rec.status ?? rec.Status ?? "pending").trim() || "pending";
  const address = String(rec.address ?? rec.Address ?? "").trim();
  const items = (rec.order_items ?? rec.orderItems ?? rec.items ?? []) as OrderItem[];
  const user = rec.user ?? rec.User;
  const userName =
    typeof user === "object" && user !== null
      ? String((user as Record<string, unknown>).name ?? (user as Record<string, unknown>).Name ?? "")
      : "";
  const userEmail =
    typeof user === "object" && user !== null
      ? String((user as Record<string, unknown>).email ?? (user as Record<string, unknown>).Email ?? "")
      : "";

  return {
    key: fallbackKey,
    id: parsedId,
    userId,
    userLabel:
      userName || userEmail || (userId ? `User #${userId}` : "Unknown user"),
    totalPrice: Number.isFinite(total) ? total : 0,
    status,
    address,
    itemCount: Array.isArray(items) ? items.length : 0,
    items: Array.isArray(items) ? items : [],
    raw: order,
  };
}

function statusBadgeClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "completed") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
  }
  if (normalized === "paid" || normalized === "processed") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300";
  }
  if (normalized === "shipped") {
    return "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300";
  }
  if (normalized === "cancelled") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300";
  }

  return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<NormalizedOrder | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    const email = localStorage.getItem("user_email");
    if (email) {
      setUserName(email.split("@")[0] || "Admin");
    }
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await fetchOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("load orders error", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await loadOrders();
    })();
  }, []);

  const normalizedOrders = useMemo(() => {
    return orders
      .map((order, idx) => normalizeOrder(order, `order-${idx}`))
      .filter((item): item is NormalizedOrder => Boolean(item));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return normalizedOrders.filter((order) => {
      const searchMatch =
        !term ||
        String(order.id).includes(term) ||
        order.userLabel.toLowerCase().includes(term) ||
        order.address.toLowerCase().includes(term);
      const statusMatch =
        statusFilter === "all" || order.status.toLowerCase() === statusFilter;
      return searchMatch && statusMatch;
    });
  }, [normalizedOrders, search, statusFilter]);

  const orderStats = useMemo(() => {
    const totalRevenue = normalizedOrders.reduce((acc, order) => acc + order.totalPrice, 0);
    const pending = normalizedOrders.filter((order) => order.status.toLowerCase() === "pending").length;
    const completed = normalizedOrders.filter((order) => order.status.toLowerCase() === "completed").length;

    return {
      totalRevenue,
      pending,
      completed,
    };
  }, [normalizedOrders]);

  async function openDetail(order: NormalizedOrder) {
    try {
      setLoadingDetail(true);
      const detail =
        order.items.length > 0
          ? order.raw
          : await fetchOrderById(order.id);
      const normalized = normalizeOrder(detail, order.key);

      if (!normalized) {
        throw new Error("Invalid order detail response");
      }

      setSelectedOrder(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await Swal.fire({
        icon: "error",
        title: "Failed to load order detail",
        text: message,
      });
    } finally {
      setLoadingDetail(false);
    }
  }

  return (
    <div className="space-y-6 font-[var(--font-geist-sans)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Welcome back, {userName}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Orders
          </h1>
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500">Dashboard / Orders</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Orders",
            value: normalizedOrders.length,
            note: "All orders loaded from backend",
            icon: (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 5h2l2 11h11l2-7H7" />
                <circle cx="10" cy="19" r="1.5" />
                <circle cx="17" cy="19" r="1.5" />
              </svg>
            ),
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Pending",
            value: orderStats.pending,
            note: "Waiting for payment",
            icon: (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v4l3 2" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            ),
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Completed",
            value: orderStats.completed,
            note: "Orders finished",
            icon: (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ),
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Revenue",
            value: `Rp ${formatNumber(orderStats.totalRevenue)}`,
            note: "Sum of order totals",
            icon: (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12h16" />
                <path d="M8 6h8" />
                <path d="M8 18h8" />
              </svg>
            ),
            color: "text-sky-600",
            bg: "bg-sky-50",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-3">
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
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{stat.note}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
            </span>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="processed">Processed</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              loadOrders();
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
            No orders found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-tl-2xl rounded-tr-2xl">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Address</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((order) => (
                  <tr key={order.key} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60">
                    <td className="px-4 py-4 font-semibold text-slate-900 dark:text-slate-100">
                      #{order.id}
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                      {order.userLabel}
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                      {order.address || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                      Rp {formatNumber(order.totalPrice)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                      {order.itemCount} items
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
                          onClick={() => openDetail(order)}
                          disabled={loadingDetail}
                        >
                          {loadingDetail ? "Opening..." : "View"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="mx-auto my-4 flex min-h-[calc(100vh-2rem)] w-full max-w-3xl items-center sm:my-6 sm:min-h-[calc(100vh-3rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[calc(100vh-2rem)] w-full overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:border dark:border-slate-800 dark:bg-slate-900 sm:max-h-[calc(100vh-3rem)] sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Order #{selectedOrder.id}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Detail order sesuai response backend.
                  </p>
                </div>
                <button
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  onClick={() => setSelectedOrder(null)}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6l-12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/80">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Summary</div>
                  <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    <div className="flex items-center justify-between gap-3">
                      <span>Status</span>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClass(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>User</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedOrder.userLabel}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Total</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        Rp {formatNumber(selectedOrder.totalPrice)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span>Address</span>
                      <span className="max-w-[18rem] text-right font-semibold text-slate-900 dark:text-slate-100">
                        {selectedOrder.address || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/80">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Items</div>
                  <div className="mt-3 space-y-3">
                    {selectedOrder.items.length === 0 ? (
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        No order items returned by backend.
                      </div>
                    ) : (
                      selectedOrder.items.map((item, idx) => (
                        <div key={item.id ?? `${selectedOrder.id}-${idx}`} className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                Product #{item.product_id}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                Qty {item.quantity}
                              </div>
                            </div>
                            <div className="text-right font-semibold text-slate-900 dark:text-slate-100">
                              Rp {formatNumber(item.price ?? 0)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}