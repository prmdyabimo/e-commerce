"use client";

import React, { useState } from "react";

type Props = {
  initial?: {
    id?: number;
    name: string;
    price: number;
    description?: string;
    stock?: number;
    image?: string;
  };
  onCreate: (payload: {
    name: string;
    price: number;
    description?: string;
    stock: number;
    imageFile: File;
  }) => Promise<void>;
  onUpdate: (
    id: string | number,
    payload: {
      name: string;
      price: number;
      description?: string;
      stock: number;
      imageFile?: File | null;
    }
  ) => Promise<void>;
  onCancel?: () => void;
};

const numberFormatter = new Intl.NumberFormat("id-ID");
const DEFAULT_IMAGE =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Crect width='140' height='140' rx='28' fill='%23E2E8F0'/%3E%3Cpath d='M34 94l22-28 24 30 16-18 24 30H34z' fill='%2394A3B8'/%3E%3Ccircle cx='52' cy='50' r='10' fill='%2394A3B8'/%3E%3C/svg%3E";
const ASSET_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function formatPrice(value: number) {
  if (!Number.isFinite(value)) return "";
  return numberFormatter.format(value);
}

function resolveImageUrl(image?: string) {
  if (!image) return DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(image)) return image;
  if (!ASSET_BASE) return image;
  return image.startsWith("/") ? `${ASSET_BASE}${image}` : `${ASSET_BASE}/${image}`;
}

export default function ProductForm({
  initial,
  onCreate,
  onUpdate,
  onCancel,
}: Props) {
  const [name, setName] = useState(initial?.name || "");
  const [priceValue, setPriceValue] = useState(initial?.price ?? 0);
  const [priceInput, setPriceInput] = useState(
    initial?.price ? formatPrice(initial.price) : ""
  );
  const [stock, setStock] = useState(initial?.stock ?? 0);
  const [existingImage, setExistingImage] = useState(initial?.image || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(
    resolveImageUrl(initial?.image)
  );
  const [description, setDescription] = useState(initial?.description || "");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const currentId = initial?.id;
  const isEditing = currentId !== undefined && currentId !== null;

  // Keep internal state in sync when `initial` changes (e.g., when clicking Edit)
  React.useEffect(() => {
    setName(initial?.name || "");
    const nextPrice = initial?.price ?? 0;
    setPriceValue(nextPrice);
    setPriceInput(nextPrice ? formatPrice(nextPrice) : "");
    setStock(initial?.stock ?? 0);
    setExistingImage(initial?.image || "");
    setImageFile(null);
    setDescription(initial?.description || "");
    setErrors({});
  }, [initial]);

  React.useEffect(() => {
    if (!imageFile) {
      setImagePreview(resolveImageUrl(existingImage));
      return undefined;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile, existingImage]);

  function validate() {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Nama produk wajib diisi.";
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      nextErrors.price = "Harga harus lebih besar dari 0.";
    }
    if (!Number.isFinite(stock) || stock < 0) {
      nextErrors.stock = "Stok tidak boleh negatif.";
    }
    if (!imageFile && !existingImage.trim())
      nextErrors.image = "Gambar produk wajib diunggah.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (currentId !== undefined && currentId !== null) {
        await onUpdate(currentId, {
          name: name.trim(),
          price: priceValue,
          stock,
          imageFile,
          description: description.trim(),
        });
      } else {
        if (!imageFile) return;
        await onCreate({
          name: name.trim(),
          price: priceValue,
          stock,
          imageFile,
          description: description.trim(),
        });
        setName("");
        setPriceValue(0);
        setPriceInput("");
        setStock(0);
        setExistingImage("");
        setImageFile(null);
        setDescription("");
        setErrors({});
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-slate-700">
            Nama Produk
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Sneakers Aurora"
          />
          {errors.name && (
            <p className="mt-2 text-xs font-medium text-rose-600">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700">
            Harga
          </label>
          <div className="mt-2 flex items-center rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200">
            <span className="text-xs font-semibold text-slate-500">Rp</span>
            <input
              className="ml-2 w-full bg-transparent text-sm outline-none"
              inputMode="numeric"
              placeholder="1.000"
              value={priceInput}
              onChange={(e) => {
                const raw = e.target.value;
                const digits = raw.replace(/[^\d]/g, "");
                const numeric = digits ? Number(digits) : 0;
                setPriceValue(numeric);
                setPriceInput(digits ? formatPrice(numeric) : "");
              }}
            />
          </div>
          {errors.price && (
            <p className="mt-2 text-xs font-medium text-rose-600">
              {errors.price}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700">
            Stok
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            type="number"
            min={0}
            value={stock}
            onChange={(e) => {
              const next = Number(e.target.value);
              setStock(Number.isFinite(next) ? next : 0);
            }}
            placeholder="0"
          />
          {errors.stock && (
            <p className="mt-2 text-xs font-medium text-rose-600">
              {errors.stock}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-slate-700">
            Image Produk
          </label>
          <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/70 p-3 shadow-sm sm:flex-row sm:items-center">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <img
                src={imagePreview}
                alt="Preview produk"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1">
              <input
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800"
                type="file"
                accept="image/*"
                required={!isEditing}
                key={`image-input-${currentId ?? "new"}`}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setImageFile(file);
                  if (!file) return;
                  setExistingImage("");
                }}
              />
              <p className="mt-2 text-xs text-slate-500">
                {isEditing
                  ? "Upload ulang jika ingin mengganti gambar."
                  : "Wajib upload 1 gambar produk."}
              </p>
            </div>
          </div>
          {errors.image && (
            <p className="mt-2 text-xs font-medium text-rose-600">
              {errors.image}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-slate-700">
            Description
          </label>
          <textarea
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Deskripsi singkat produk."
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          type="submit"
          disabled={loading}
        >
          {loading ? "Saving..." : isEditing ? "Update" : "Create"}
        </button>
        {isEditing && (
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            onClick={() => onCancel && onCancel()}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
