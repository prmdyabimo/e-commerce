package models

import "gorm.io/gorm"

//struct = bentuk tabel
type User struct {
	gorm.Model
	ID       uint `gorm:"primaryKey"`
	Name     string
	Email    string `gorm:"unique"`
	Password string
	Role     string
}
