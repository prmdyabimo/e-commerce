package models

import "gorm.io/gorm"

type Product struct {
	//ID, CreatedAt, UpdatedAt otomatis
	gorm.Model
	Name        string `json:"name"`
	description string `json:"description"`
	price       int    `json:"price"`
	stock       int    `json:"stock"`
	//json supaya bisa dibaca postman
}
