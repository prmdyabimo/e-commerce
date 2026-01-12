package routes

import (
	"mini-ecommerce/controllers"
	"mini-ecommerce/middlewares"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRoutes(r *gin.Engine, db *gorm.DB) {

	// =====================
	// INIT CONTROLLERS
	// =====================
	authController := controllers.NewAuthController(db)
	productController := controllers.NewProductController(db)
	userController := controllers.NewUserController(db)
	categoryController := controllers.NewCategoryController(db)

	// =====================
	// PUBLIC ROUTES
	// =====================
	r.POST("/register", authController.Register)
	r.POST("/login", authController.Login)

	// =====================
	// PROTECTED ROUTES
	// =====================
	protected := r.Group("/")
	protected.Use(middlewares.AuthMiddleware())
	{
		// ===== PRODUCTS =====
		protected.POST("/products", productController.Create)
		protected.GET("/products", productController.GetAll)
		protected.GET("/products/:id", productController.GetByID)
		protected.PUT("/products/:id", productController.Update)
		protected.DELETE("/products/:id", productController.Delete)

		// ===== USERS =====
		protected.GET("/users", userController.GetAll)
		protected.GET("/users/:id", userController.GetByID)
		protected.DELETE("/users/:id", userController.Delete)

		// ===== CATEGORIES =====
		protected.POST("/categories", categoryController.Create)
		protected.GET("/categories", categoryController.FindAll)
		protected.GET("/categories/:id", categoryController.FindByID)
		protected.PUT("/categories/:id", categoryController.Update)
		protected.DELETE("/categories/:id", categoryController.Delete)
	}
}
