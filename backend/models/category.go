package models

import "time"

//category mempresentasikan tabel categories di database
type Category struct {
	//ID primary key (auti increment), Name category, wajib di isi dan harus unik, timestamp otomatis dari gorm(create_at dan update_at)
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"type:varchar(100);not null;unique" json:"name"`
	CreatedAt time.Time `json:"create_at"`
	UpdatedAt time.Time `json:"update_at"`
	//relasi one-to-many, satu category bisa punya banyak product, "omitempty" agar tidak tampil jika kosong
	Products []Product `json:"products, omitempty"`
}
