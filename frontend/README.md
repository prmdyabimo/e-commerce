# native.co Frontend

Frontend toko dan dashboard admin native.co menggunakan Next.js App Router, React, TypeScript, Tailwind CSS, dan SweetAlert2.

## Menjalankan lokal

### Terminal 1: backend dan MySQL

1. Pastikan MySQL berjalan dan kredensial pada `backend/.env` benar.
2. Dari direktori `backend`, jalankan:

   ```powershell
   go run .
   ```

3. Pastikan `http://127.0.0.1:8080/health` merespons `{"status":"OK"}`.

### Terminal 2: frontend

1. Salin `.env.example` menjadi `.env.local` jika belum ada:

   ```env
   API_URL=http://127.0.0.1:8080
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8080
   ```

   Di PowerShell, salin contoh tersebut dengan `Copy-Item .env.example .env.local`, lalu pastikan nilainya mengarah ke backend lokal.

2. Dari direktori `frontend`, jalankan:

   ```bash
   npm install
   npm run dev
   ```

Buka `http://localhost:3000/shop`. Jangan jalankan `npm run dev` lebih dari sekali untuk folder ini; Next.js menggunakan satu lock file development. Jika melihat `Unable to acquire lock`, hentikan proses lama dengan `Ctrl+C` pada terminal yang menjalankannya.

Permintaan API browser dikirim melalui route handler Next.js di `/api` ke backend menggunakan `API_URL`. Jika backend berhenti atau `API_URL` salah, permintaan API menampilkan `502`; hidupkan kembali backend dan pastikan port `8080` aktif. `NEXT_PUBLIC_API_URL` digunakan untuk memuat gambar produk dari backend.

## Perintah

- `npm run dev` — server pengembangan
- `npm run lint` — pemeriksaan ESLint
- `npm run build` — build produksi
