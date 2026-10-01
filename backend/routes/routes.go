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
	uploadController := controllers.NewUploadController()
	orderController := controllers.NewOrderController(db)

	r.POST("/register", authController.Register)
	r.POST("/login", authController.Login)

	r.GET("/products", productController.GetAll)
	r.GET("/products/:id", productController.GetByID)
	r.GET("/categories", categoryController.FindAll)
	r.GET("/categories/:id", categoryController.FindByID)

	protected := r.Group("/")
	protected.Use(middlewares.AuthMiddleware())
	{
		protected.POST("/orders", orderController.Create)
		protected.GET("/orders", orderController.GetAll)
		protected.GET("/orders/:id", orderController.GetByID)
	}

	admin := protected.Group("/")
	admin.Use(middlewares.RequireRole("admin"))
	{
		admin.POST("/upload", uploadController.UploadProductImage)

		admin.POST("/products", productController.Create)
		admin.PUT("/products/:id", productController.Update)
		admin.DELETE("/products/:id", productController.Delete)

		admin.GET("/users", userController.GetAll)
		admin.GET("/users/:id", userController.GetByID)
		admin.POST("/users", userController.Create)
		admin.PUT("/users/:id", userController.Update)
		admin.DELETE("/users/:id", userController.Delete)

		admin.POST("/categories", categoryController.Create)
		admin.PUT("/categories/:id", categoryController.Update)
		admin.DELETE("/categories/:id", categoryController.Delete)
	}
}
