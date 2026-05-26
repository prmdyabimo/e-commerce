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

	log.Println("DEBUG: program started")

	err := godotenv.Load()
	if err != nil {
		log.Println("DEBUG: .env not found")
	} else {
		log.Println("DEBUG: .env success to load")
	}

	apiKey := os.Getenv("API_KEY")
	log.Println("DEBUG: API_KEY =", apiKey)

	if apiKey == "" {
		log.Fatal("API_KEY not found in env")
	}

	// =====================
	// INIT GIN
	// =====================
	r := gin.Default()

	// static file (upload image)
	r.StaticFS("/uploads", gin.Dir("uploads", false))

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
		&models.Category{},
		&models.Product{},
		&models.Order{},
		&models.OrderItem{},
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
