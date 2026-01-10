package routes

import (
	"mini-ecommerce/controllers"
	"mini-ecommerce/middlewares"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {

	// =====================
	// PUBLIC ROUTES
	// =====================
	r.POST("/register", controllers.Register)
	r.POST("/login", controllers.Login)

	// =====================
	// PROTECTED ROUTES
	// =====================
	product := r.Group("/products")
	product.Use(middlewares.AuthMiddleware())
	{
		product.POST("", controllers.CreateProduct)
		product.GET("", controllers.GetProducts)
		product.GET("/:id", controllers.GetProductsByID)
		product.PUT("/:id", controllers.UpdateProduct)
		product.DELETE("/:id", controllers.DeleteProduct)
	}

	user := r.Group("/users")
	user.Use(middlewares.AuthMiddleware())
	{
		user.GET("", controllers.GetUsers)
		user.PUT("/:id", controllers.UpdateUser)
	}
}
