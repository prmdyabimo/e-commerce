package main

import (
	"mini-ecommerce/config"
	"mini-ecommerce/models"
	"mini-ecommerce/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	//tambahkan migrasi table
	r := gin.Default()

	r.Static("/uploads", "./uploads")

	//connect database
	config.ConnectDatabase()

	//buat automigrate
	config.DB.AutoMigrate(
		&models.User{},
		&models.Product{},
	)

	// enable CORS for local frontend during development
	// consider restricting Origins in production
	r.Use(cors.Default())

	//routes
	routes.SetupRoutes(r)

	r.Run(":8080")
}
