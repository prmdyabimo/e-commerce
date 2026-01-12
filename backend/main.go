package main

import (
	"mini-ecommerce/config"
	"mini-ecommerce/models"
	"mini-ecommerce/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {

	// inisialisasi gin
	r := gin.Default()

	// static file (upload image)
	r.Static("/uploads", "./uploads")

	// =====================
	// INIT DATABASE
	// =====================
	db := config.InitDB()

	// automigrate table
	db.AutoMigrate(
		&models.User{},
		&models.Product{},
		&models.Category{},
	)

	// enable CORS
	r.Use(cors.Default())

	// =====================
	// ROUTES
	// =====================
	routes.SetupRoutes(r, db)

	// run server
	r.Run(":8080")
}
