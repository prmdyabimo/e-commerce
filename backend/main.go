package main

import (
	"log"
	"os"
	"time"

	"mini-ecommerce/config"
	"mini-ecommerce/middlewares"
	"mini-ecommerce/models"
	"mini-ecommerce/routes"
	"mini-ecommerce/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Printf("No .env file loaded: %v", err)
	}

	if err := utils.ValidateJWTSecret(); err != nil {
		log.Fatal(err)
	}

	r := gin.Default()

	r.StaticFS("/uploads", gin.Dir("uploads", false))

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-API-Key"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	db, err := config.InitDB()
	if err != nil {
		log.Fatal(err)
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.Category{},
		&models.Product{},
		&models.Order{},
		&models.OrderItem{},
	); err != nil {
		log.Fatalf("migrate database: %v", err)
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "OK"})
	})

	api := r.Group("/api")
	api.Use(middlewares.APIKeyMiddleware())
	{
		api.GET("/secure", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"message": "API KEY VALID ✅",
			})
		})
	}

	routes.SetupRoutes(r, db)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server running on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("start server: %v", err)
	}
}
