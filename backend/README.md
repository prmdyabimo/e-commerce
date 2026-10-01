# native.co Backend

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

### Mengisi katalog contoh

Untuk menambahkan 1.000 produk katalog contoh beserta ilustrasi SVG lokal dan kategori, dari direktori `backend` jalankan:

```powershell
go run .\scripts\seed_catalog
```

Seeder aman dijalankan ulang: produk contoh yang sudah ada tidak akan diduplikasi. Gambar disimpan di `uploads/products`, sehingga tetap lokal dan tidak bergantung pada layanan gambar pihak ketiga.

Untuk mengosongkan katalog sebelum mengunggah produk sendiri, jalankan dari direktori `backend`:

```powershell
go run .\scripts\clear_catalog
```

Perintah ini mengarsipkan seluruh produk aktif menggunakan soft delete: produk hilang dari toko dan daftar admin, sedangkan kategori, riwayat pesanan, dan file gambar yang diunggah tetap disimpan.

Untuk mengganti gambar katalog dengan foto kategori berlisensi dari Wikimedia Commons, jalankan:

```powershell
go run .\scripts\import_commons_photos
```

Foto diunduh ke `uploads/products`, dipakai sebagai foto representatif kategori (bukan foto resmi setiap model), dan atribusi artis, sumber, serta lisensinya disimpan di `uploads/products/commons-attribution.json`. Toko menyediakan tautan ke manifest tersebut.

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

### Menyiapkan admin pertama

Tidak ada akun admin bawaan. Daftarkan akun melalui halaman `/register`, lalu promosikan hanya akun yang Anda kendalikan melalui MySQL:

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'email-yang-didaftarkan';
```

Pastikan query mengubah tepat satu baris, lalu masuk kembali agar token baru memuat role admin. Jangan membuka endpoint registrasi publik untuk membuat admin.

Pembuatan produk menggunakan JSON. Update produk menggunakan `multipart/form-data` dengan field `name`, `price`, `description`, `stock`, `category_id`, dan `image` (opsional). Upload produk melalui `/upload` juga menggunakan field `image`.

Order dibuat dengan alamat dan daftar produk/kuantitas. Harga diambil dari database, stok divalidasi dan dikurangi dalam transaksi database.

## Catatan

- GORM menjalankan AutoMigrate ketika server dimulai.
- Gambar disimpan pada `uploads/products`.
- Untuk frontend Next.js, atur `API_URL=http://localhost:8080` pada environment frontend agar server-side API proxy dapat terhubung ke backend. `NEXT_PUBLIC_API_URL` digunakan frontend untuk URL gambar.
