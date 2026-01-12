package config

import (
	"log"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

//initdb membuat dan mengembalikan koneksi database
func InitDB() *gorm.DB {
	
	dsn := "root:@tcp(127.0.0.1:3306)/mini_ecommerce?charset=utf8mb4&parseTime=True&loc=Local"

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to Connect databse", err)
	}
	
	return db
}