package config

import (
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// DB = koneksi database (global)
var DB *gorm.DB

func ConnectDatabase() {

	// format koneksi database
	dsn := "root:@tcp(127.0.0.1:3306)/mini_ecommerce?charset=utf8mb4&parseTime=True&loc=Local"

	// buka koneksi
	database, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(err.Error())
	}

	DB = database
}
