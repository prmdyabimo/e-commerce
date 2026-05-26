package controllers

import (
	"mini-ecommerce/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type OrderController struct {
	DB *gorm.DB
}

// construktor
func NewOrderController(db *gorm.DB) *OrderController {
	return &OrderController{DB: db}
}

// =============
// CREATE ORDER
// =============
type OrderItemRequest struct {
	ProductID uint `json:"product_id"`
	Quantity  int  `json:"quantity"`
}

type CreateOrderRequest struct {
	Address string             `json:"address"`
	Items   []OrderItemRequest `json:"items"`
}

func (oc *OrderController) Create(c *gin.Context) {

	var req CreateOrderRequest

	// bind json
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// ambil user id dari JWT middleware
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not found",
		})
		return
	}

	totalPrice := 0

	// create order
	order := models.Order{
		UserID:  uint(userID.(float64)),
		Address: req.Address,
		Status:  "pending",
	}

	// save order
	if err := oc.DB.Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create order",
		})
		return
	}

	// looping items
	for _, item := range req.Items {

		var product models.Product

		// find product
		if err := oc.DB.First(&product, item.ProductID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Product not found",
			})
			return
		}

		// hitung subtotal
		subtotal := product.Price * item.Quantity

		totalPrice += subtotal

		// create order item
		orderItem := models.OrderItem{
			OrderID:   order.ID,
			ProductID: product.ID,
			Quantity:  item.Quantity,
			Price:     product.Price,
		}

		if err := oc.DB.Create(&orderItem).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed create order item",
			})
			return
		}

		// kurangi stock
		product.Stock -= item.Quantity

		oc.DB.Save(&product)
	}

	// update total
	order.TotalPrice = totalPrice

	oc.DB.Save(&order)

	// preload relation
	oc.DB.Preload("OrderItems.Product").
		Preload("User").
		First(&order, order.ID)

	c.JSON(http.StatusCreated, order)
}

// =======================
// GET ALL ORDERS
// =======================

func (oc *OrderController) GetAll(c *gin.Context) {

	var orders []models.Order

	oc.DB.Preload("OrderItems.Product").
		Preload("User").
		Find(&orders)

	c.JSON(http.StatusOK, orders)
}

// =======================
// GET ORDER BY ID
// =======================

func (oc *OrderController) GetByID(c *gin.Context) {

	var order models.Order

	id := c.Param("id")

	if err := oc.DB.Preload("OrderItems.Product").
		Preload("User").
		First(&order, id).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "Order not found",
		})
		return
	}

	c.JSON(http.StatusOK, order)
}
