package controllers

import (
	"errors"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"mini-ecommerce/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type OrderController struct {
	DB *gorm.DB
}

func NewOrderController(db *gorm.DB) *OrderController {
	return &OrderController{DB: db}
}

type OrderItemRequest struct {
	ProductID uint `json:"product_id" binding:"required"`
	Quantity  int  `json:"quantity" binding:"required,gt=0"`
}

type CreateOrderRequest struct {
	Address string             `json:"address" binding:"required"`
	Items   []OrderItemRequest `json:"items" binding:"required,min=1,dive"`
}

func (oc *OrderController) Create(c *gin.Context) {
	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	address := strings.TrimSpace(req.Address)
	if address == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Address is required"})
		return
	}
	userID, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}
	orderUserID, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user identity"})
		return
	}

	quantities := make(map[uint]int)
	for _, item := range req.Items {
		quantities[item.ProductID] += item.Quantity
	}
	productIDs := make([]uint, 0, len(quantities))
	for productID := range quantities {
		productIDs = append(productIDs, productID)
	}
	sort.Slice(productIDs, func(i, j int) bool { return productIDs[i] < productIDs[j] })

	var order models.Order
	responseStatus := http.StatusInternalServerError
	responseError := "Failed to create order"
	err := oc.DB.Transaction(func(tx *gorm.DB) error {
		products := make(map[uint]models.Product, len(quantities))
		for _, productID := range productIDs {
			quantity := quantities[productID]
			var product models.Product
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&product, productID).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					responseStatus = http.StatusNotFound
					responseError = "Product not found"
				}
				return err
			}
			if product.Stock < quantity {
				responseStatus = http.StatusConflict
				responseError = "Insufficient stock for product " + strconv.FormatUint(uint64(productID), 10)
				return errors.New(responseError)
			}
			products[productID] = product
		}

		order = models.Order{
			UserID:  orderUserID,
			Address: address,
			Status:  "pending",
		}
		if err := tx.Create(&order).Error; err != nil {
			return err
		}

		for _, item := range req.Items {
			product := products[item.ProductID]
			order.TotalPrice += product.Price * item.Quantity
			if err := tx.Create(&models.OrderItem{
				OrderID:   order.ID,
				ProductID: product.ID,
				Quantity:  item.Quantity,
				Price:     product.Price,
			}).Error; err != nil {
				return err
			}
		}

		for _, productID := range productIDs {
			quantity := quantities[productID]
			result := tx.Model(&models.Product{}).
				Where("id = ? AND stock >= ?", productID, quantity).
				Update("stock", gorm.Expr("stock - ?", quantity))
			if result.Error != nil {
				return result.Error
			}
			if result.RowsAffected != 1 {
				responseStatus = http.StatusConflict
				responseError = "Insufficient stock for product " + strconv.FormatUint(uint64(productID), 10)
				return errors.New(responseError)
			}
		}

		if err := tx.Save(&order).Error; err != nil {
			return err
		}
		return tx.Preload("OrderItems.Product").Preload("User").First(&order, order.ID).Error
	})
	if err != nil {
		c.JSON(responseStatus, gin.H{"error": responseError})
		return
	}

	c.JSON(http.StatusCreated, order)
}

func (oc *OrderController) GetAll(c *gin.Context) {
	var orders []models.Order
	query := oc.DB.Preload("OrderItems.Product").Preload("User").Order("id DESC")
	role, _ := c.Get("role")
	if role != "admin" {
		userID, ok := c.Get("user_id")
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			return
		}
		query = query.Where("user_id = ?", userID)
	}
	if err := query.Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}
	c.JSON(http.StatusOK, orders)
}

func (oc *OrderController) GetByID(c *gin.Context) {
	var order models.Order
	if err := oc.DB.Preload("OrderItems.Product").Preload("User").First(&order, c.Param("id")).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch order"})
		return
	}

	role, _ := c.Get("role")
	userID, _ := c.Get("user_id")
	ownerID, ok := userID.(uint)
	if role != "admin" && (!ok || order.UserID != ownerID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}
	c.JSON(http.StatusOK, order)
}
