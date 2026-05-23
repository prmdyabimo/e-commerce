package main

import (
	"log"
	"os"
	"time"

	"mini-ecommerce/config"
	"mini-ecommerce/middlewares"
	"mini-ecommerce/models"
	"mini-ecommerce/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {

	log.Println("DEBUG: program mulai")

	err := godotenv.Load()
	if err != nil {
		log.Println("DEBUG: .env tidak ditemukan")
	} else {
		log.Println("DEBUG: .env berhasil diload")
	}

	apiKey := os.Getenv("API_KEY")
	log.Println("DEBUG: API_KEY =", apiKey)

	if apiKey == "" {
		log.Fatal("API_KEY tidak ditemukan di env")
	}

	// =====================
	// INIT GIN
	// =====================
	r := gin.Default()

	// static file (upload image)
	r.Static("/uploads", "./uploads")

	// enable CORS
	r.Use(cors.New(cors.Config{
	AllowOrigins: []string{
		"http://localhost:3000",
	},
	AllowMethods: []string{
		"GET",
		"POST",
		"PUT",
		"DELETE",
		"OPTIONS",
	},
	AllowHeaders: []string{
		"Origin",
		"Content-Type",
		"Authorization",
		"x-api-key",
	},
	ExposeHeaders: []string{
		"Content-Length",
	},
	AllowCredentials: true,
	MaxAge: 12 * time.Hour,
}))

	// =====================
	// INIT DATABASE
	// =====================
	db := config.InitDB()

	db.AutoMigrate(
		&models.User{},
		&models.Product{},
		&models.Category{},
	)

	// =====================
	// PUBLIC ROUTES
	// =====================
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "OK"})
	})

	// =====================
	// PROTECTED ROUTES (API KEY)
	// =====================
	api := r.Group("/api")
	api.Use(middlewares.APIKeyMiddleware())
	{
		api.GET("/secure", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"message": "API KEY VALID ✅",
			})
		})
	}

	// =====================
	// MAIN ROUTES
	// =====================
	routes.SetupRoutes(r, db)

	// =====================
	// RUN SERVER
	// =====================
	log.Println("Server running on :8080")
	r.Run(":8080")
}
