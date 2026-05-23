"use client";

import React, { useState } from "react";

type ProductFormProps = {
  initial?: {
    id?: number;
    name: string;
    price: number;
    description?: string;
    stock?: number;
    image?: string;
    category_id?: number;
  };

  categories: {
    id: number;
    name: string;
  }[];

  onCreate: (payload: {
    name: string;
    price: number;
    description?: string;
    stock: number;
    imageFile: File;
    category_id: number;
  }) => Promise<void>;

  onUpdate: (
    id: string | number,
    payload: {
      name: string;
      price: number;
      description?: string;
      stock: number;
      imageFile?: File | null;
      category_id: number;
    },
  ) => Promise<void>;

  onCancel?: () => void;
};

const numberFormatter = new Intl.NumberFormat("id-ID");

const DEFAULT_IMAGE =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Crect width='140' height='140' rx='28' fill='%23E2E8F0'/%3E%3Cpath d='M34 94l22-28 24 30 16-18 24 30H34z' fill='%2394A3B8'/%3E%3Ccircle cx='52' cy='50' r='10' fill='%2394A3B8'/%3E%3C/svg%3E";

const ASSET_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function formatPrice(value: number) {
  if (!Number.isFinite(value)) return "";
  return numberFormatter.format(value);
}

function resolveImageUrl(image?: string) {
  if (!image) return DEFAULT_IMAGE;

  if (/^https?:\/\//i.test(image)) return image;

  if (!ASSET_BASE) return image;

  return image.startsWith("/")
    ? `${ASSET_BASE}${image}`
    : `${ASSET_BASE}/${image}`;
}

export default function ProductForm({
  initial,
  onCreate,
  onUpdate,
  onCancel,
  categories,
}: ProductFormProps) {
  const [name, setName] = useState(initial?.name || "");

  const [priceValue, setPriceValue] = useState(initial?.price ?? 0);

  const [priceInput, setPriceInput] = useState(
    initial?.price ? formatPrice(initial.price) : "",
  );

  const [stock, setStock] = useState(initial?.stock ?? 0);

  const [categoryId, setCategoryId] = useState(initial?.category_id ?? 0);

  const [existingImage, setExistingImage] = useState(initial?.image || "");

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState(
    resolveImageUrl(initial?.image),
  );

  const [description, setDescription] = useState(initial?.description || "");

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentId = initial?.id;

  const isEditing = currentId !== undefined && currentId !== null;

  // sync state when editing product
  React.useEffect(() => {
    setName(initial?.name || "");

    const nextPrice = initial?.price ?? 0;

    setPriceValue(nextPrice);

    setPriceInput(nextPrice ? formatPrice(nextPrice) : "");

    setStock(initial?.stock ?? 0);

    setCategoryId(initial?.category_id ?? 0);

    setExistingImage(initial?.image || "");

    setImageFile(null);

    setDescription(initial?.description || "");

    setErrors({});
  }, [initial]);

  // preview image when file changes
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

    if (categoryId <= 0) {
      nextErrors.category = "Category is required.";
    }

    if (!name.trim()) {
      nextErrors.name = "Product name is required.";
    }

    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      nextErrors.price = "Price must be greater than 0.";
    }

    if (!Number.isFinite(stock) || stock < 0) {
      nextErrors.stock = "Stock cannot be negative.";
    }

    if (!imageFile && !existingImage.trim()) {
      nextErrors.image = "Product image is required.";
    }

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
          category_id: categoryId,
        });
      } else {
        if (!imageFile) return;

        await onCreate({
          name: name.trim(),
          price: priceValue,
          stock,
          imageFile,
          description: description.trim(),
          category_id: categoryId,
        });

        // reset form after successful submission
        setName("");
        setPriceValue(0);
        setPriceInput("");
        setStock(0);
        setCategoryId(0);
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
        {/* NAME */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Product Name
          </label>

          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Example: Aurora Sneakers"
          />

          {errors.name && (
            <p className="mt-2 text-xs text-rose-600">{errors.name}</p>
          )}
        </div>

        {/* PRICE */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Price
          </label>

          <div className="mt-2 flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">$</span>

            <input
              className="ml-2 w-full bg-transparent text-slate-900 outline-none dark:text-slate-100 dark:placeholder-slate-500"
              inputMode="numeric"
              placeholder="1000"
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
            <p className="mt-2 text-xs text-rose-600">{errors.price}</p>
          )}
        </div>

        {/* STOCK */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Stock
          </label>

          <input
            type="number"
            min={0}
            value={stock}
            onChange={(e) => {
              const next = Number(e.target.value);

              setStock(Number.isFinite(next) ? next : 0);
            }}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />

          {errors.stock && (
            <p className="mt-2 text-xs text-rose-600">{errors.stock}</p>
          )}
        </div>

        {/* CATEGORY */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Category
          </label>

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            required
          >
            <option value={0}>Pilih Category</option>

            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {errors.category && (
            <p className="mt-2 text-xs text-rose-600">{errors.category}</p>
          )}
        </div>

        {/* IMAGE */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Product Image
          </label>

          <label className="mt-2 block cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-800/60">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-900">
              <img
                src={imagePreview}
                alt="Product preview"
                className="h-10 w-10 rounded-xl object-cover"
              />
            </div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Click to upload image
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              PNG, JPG, GIF maximum 5MB
            </div>
            <div className="mt-3 flex w-full justify-center">
              <input
                type="file"
                accept="image/*"
                required={!isEditing}
                key={`image-input-${currentId ?? "new"}`}
                id={`file-input-${currentId ?? "new"}`}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;

                  setImageFile(file);

                  if (!file) return;

                  setExistingImage("");
                }}
              />
              <label
                htmlFor={`file-input-${currentId ?? "new"}`}
                className="cursor-pointer text-xs text-slate-600 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
              >
                Choose File
              </label>
            </div>
            <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
              {isEditing
                ? "Re-upload if you want to change the image."
                : "Product image is required."}
            </p>
          </label>

          {errors.image && (
            <p className="mt-2 text-xs text-rose-600">{errors.image}</p>
          )}
        </div>

        {/* DESCRIPTION */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Description
          </label>

          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            placeholder="Brief product description."
          />
        </div>
      </div>

      {/* BUTTON */}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          {loading ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Simpan Produk"}
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={() => onCancel && onCancel()}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
}
