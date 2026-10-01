# Mini E-Commerce Frontend

Frontend toko dan dashboard admin menggunakan Next.js App Router, React, TypeScript, Tailwind CSS, dan SweetAlert2.

## Menjalankan lokal

1. Jalankan backend Go di `http://localhost:8080`.
2. Buat `frontend/.env.local`:

   ```env
   API_URL=http://localhost:8080
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

3. Dari direktori `frontend`, jalankan:

   ```bash
   npm install
   npm run dev
   ```

Buka `http://localhost:3000`. Halaman `/shop` adalah katalog, sedangkan `/login` dan `/register` adalah autentikasi.

Permintaan API browser dikirim melalui route handler Next.js di `/api` ke backend menggunakan `API_URL`. `NEXT_PUBLIC_API_URL` hanya diperlukan untuk memuat gambar produk dari backend.

## Perintah

- `npm run dev` — server pengembangan
- `npm run lint` — pemeriksaan ESLint
- `npm run build` — build produksi
