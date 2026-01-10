package models

import "gorm.io/gorm"

type Product struct {
	//ID, CreatedAt, UpdatedAt otomatis
	gorm.Model
	Name        string `json:"name"`
	Description string `json:"description"`
	Price       int    `json:"price"`
	Stock       int    `json:"stock"`
	Image       string `json:"image"`
	UserID      uint   `json:"user_id"`
	//json supaya bisa dibaca postman
}

