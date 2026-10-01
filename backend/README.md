# Mini E-Commerce Backend

REST API untuk aplikasi e-commerce, dibangun menggunakan Go, Gin, GORM, dan MySQL.

## Prasyarat

- Go 1.24+
- MySQL 8+
- Node.js untuk menjalankan frontend

## Konfigurasi

Salin `.env.example` menjadi `.env` di direktori `backend`, lalu atur nilainya:

```env
MYSQL_DSN=root:password@tcp(127.0.0.1:3306)/mini_ecommerce?charset=utf8mb4&parseTime=True&loc=Local
JWT_SECRET=ganti-dengan-random-secret-minimal-32-karakter
API_KEY=ganti-dengan-api-key-acak
PORT=8080
```

`MYSQL_DSN` dan `JWT_SECRET` wajib diisi. `API_KEY` hanya digunakan oleh endpoint contoh `/api/secure`.
Jangan commit file `.env` atau gunakan contoh secret di lingkungan produksi.

## Menjalankan

Import `mini-ecommerce.sql` bila perlu, lalu dari direktori `backend` jalankan:

```bash
go run .
```

Server berjalan pada port `8080` secara default. Endpoint `/health` digunakan untuk health check.

## Akses API

Endpoint produk dan kategori untuk katalog dapat diakses publik:

| Method | Endpoint | Akses |
| --- | --- | --- |
| POST | `/register` | Publik |
| POST | `/login` | Publik |
| GET | `/products`, `/products/:id` | Publik |
| GET | `/categories`, `/categories/:id` | Publik |
| POST | `/orders` | User terautentikasi |
| GET | `/orders`, `/orders/:id` | User terautentikasi; user hanya dapat membaca pesanannya sendiri |
| POST/PUT/DELETE | `/products`, `/categories` | Admin |
| POST | `/upload` | Admin |
| GET/POST/PUT/DELETE | `/users` | Admin |

Endpoint terlindungi menggunakan header:

```http
Authorization: Bearer <jwt-token>
```

Login menerima email dan password, lalu mengembalikan token JWT berlaku selama 24 jam. Registrasi dan pembuatan user admin mensyaratkan password minimal 8 karakter. User baru melalui registrasi publik selalu mendapat role `user`.

Pembuatan produk menggunakan JSON. Update produk menggunakan `multipart/form-data` dengan field `name`, `price`, `description`, `stock`, `category_id`, dan `image` (opsional). Upload produk melalui `/upload` juga menggunakan field `image`.

Order dibuat dengan alamat dan daftar produk/kuantitas. Harga diambil dari database, stok divalidasi dan dikurangi dalam transaksi database.

## Catatan

- GORM menjalankan AutoMigrate ketika server dimulai.
- Gambar disimpan pada `uploads/products`.
- Untuk frontend Next.js, atur `API_URL=http://localhost:8080` pada environment frontend agar server-side API proxy dapat terhubung ke backend. `NEXT_PUBLIC_API_URL` digunakan frontend untuk URL gambar.
