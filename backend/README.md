# Backend Mini E-Commerce

Backend ini dibangun dengan **Go**, **Gin**, **GORM**, dan **MySQL** untuk mendukung fitur autentikasi, manajemen produk, kategori, dan user. Proyek ini juga menyediakan validasi **JWT** untuk akses protected route serta middleware **API Key** untuk endpoint tertentu.

## Ringkasan Fitur

- Register dan login user.
- Autentikasi menggunakan JWT Bearer token.
- CRUD produk.
- CRUD kategori.
- Manajemen user untuk admin.
- Upload gambar produk ke folder `uploads/products`.
- Endpoint health check dan endpoint secure berbasis API key.

## Teknologi yang Digunakan

- Go 1.24
- Gin Gonic
- GORM
- MySQL
- JWT (`github.com/golang-jwt/jwt/v5`)
- bcrypt untuk hashing password
- CORS support untuk frontend Next.js

## Struktur Folder

```text
backend/
├── config/        # Konfigurasi database
├── controllers/   # Logic handler request
├── middlewares/   # Middleware auth dan API key
├── models/        # Struct model GORM
├── routes/        # Definisi routing
├── uploads/       # File upload image produk
├── utils/         # Helper JWT dan password
├── main.go        # Entry point server
└── mini-ecommerce.sql # Dump database contoh
```

## Prasyarat

- Go 1.24+
- MySQL 8+
- Database bernama `mini_ecommerce`
- Frontend berjalan di `http://localhost:3000` jika dipakai bersama project frontend

## Konfigurasi

Secara default, backend membaca environment variable berikut:

- `API_KEY` untuk middleware keamanan endpoint `/api/secure`

Selain itu, koneksi database saat ini masih menggunakan DSN bawaan di `config/database.go`:

```go
root:@tcp(127.0.0.1:3306)/mini_ecommerce?charset=utf8mb4&parseTime=True&loc=Local
```

Pastikan MySQL lokal Anda sesuai dengan konfigurasi tersebut, atau ubah DSN pada file `config/database.go`.

## Instalasi

1. Masuk ke folder backend.
2. Install dependency Go jika belum ada.
3. Buat file `.env` pada folder backend dan isi `API_KEY`.

Contoh:

```env
API_KEY=secret-api-key-anda
```

## Menjalankan Project

### 1. Import database

Jalankan file `mini-ecommerce.sql` ke MySQL untuk membuat database awal.

### 2. Jalankan server

```bash
go run main.go
```

Server akan berjalan di:

```text
http://localhost:8080
```

## Alur Otentikasi

- `POST /register` akan menyimpan user baru dengan role default `user`.
- Password disimpan dalam bentuk hash bcrypt.
- `POST /login` akan mengembalikan JWT token jika email dan password valid.
- Endpoint protected wajib menyertakan header:

```http
Authorization: Bearer <token>
```

## Endpoint API

### Public

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/health` | Health check server |
| POST | `/register` | Register user baru |
| POST | `/login` | Login dan generate token |

### Secure API Key

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/api/secure` | Contoh endpoint yang wajib header `X-API-Key` |

Header yang dibutuhkan:

```http
X-API-Key: <nilai_api_key>
```

### Protected JWT

Semua endpoint berikut wajib mengirim JWT Bearer token pada header `Authorization`.

#### Products

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/products` | Ambil semua produk |
| GET | `/products/:id` | Ambil detail produk |
| POST | `/products` | Buat produk baru |
| PUT | `/products/:id` | Update produk |
| DELETE | `/products/:id` | Hapus produk |

Request create/update produk menggunakan `multipart/form-data` dengan field:

- `name`
- `price`
- `description`
- `stock`
- `category_id`
- `image` (opsional untuk update, dan wajib jika ingin upload gambar baru)

#### Users

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/users` | Ambil semua user |
| GET | `/users/:id` | Ambil detail user |
| DELETE | `/users/:id` | Hapus user |

#### Categories

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/categories` | Ambil semua kategori beserta products |
| GET | `/categories/:id` | Ambil detail kategori beserta products |
| POST | `/categories` | Buat kategori baru |
| PUT | `/categories/:id` | Update kategori |
| DELETE | `/categories/:id` | Hapus kategori |

Request body category menggunakan JSON:

```json
{
	"name": "Elektronik"
}
```

## Model Data

### User

- `id`
- `name`
- `email`
- `password`
- `role`

### Product

- `id`
- `name`
- `description`
- `price`
- `stock`
- `image`
- `category_id`
- `category`

### Category

- `id`
- `name`
- `products`

## Catatan Implementasi

- Database di-auto migrate saat server dimulai.
- Produk menyimpan file gambar ke folder `uploads/products`.
- CORS sudah diaktifkan untuk frontend di `http://localhost:3000`.
- JWT secret pada saat ini masih hardcoded di `utils/jwt.go`; jika ingin production-ready, pindahkan ke environment variable.

## Contoh Response

### Login berhasil

```json
{
	"message": "Login berhasil",
	"token": "<jwt-token>"
}
```

### Endpoint secure

```json
{
	"message": "API KEY VALID ✅"
}
```

## Pengembangan Lanjutan

Jika ingin melanjutkan pengembangan, langkah yang paling masuk akal adalah:

- memindahkan DSN database ke environment variable,
- memindahkan JWT secret ke environment variable,
- menambahkan validasi request yang lebih ketat,
- menambahkan role-based authorization untuk admin dan user.
