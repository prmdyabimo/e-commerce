package controllers

import (
	"errors"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

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

type updateOrderStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

var validOrderStatuses = map[string]struct{}{
	"pending":   {},
	"paid":      {},
	"processed": {},
	"shipped":   {},
	"completed": {},
	"cancelled": {},
}

func isValidOrderStatus(status string) bool {
	_, valid := validOrderStatuses[strings.ToLower(strings.TrimSpace(status))]
	return valid
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

func (oc *OrderController) UpdateStatus(c *gin.Context) {
	var input updateOrderStatusRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	status := strings.ToLower(strings.TrimSpace(input.Status))
	if !isValidOrderStatus(status) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order status"})
		return
	}

	result := oc.DB.Model(&models.Order{}).
		Where("id = ?", c.Param("id")).
		Update("status", status)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status"})
		return
	}
	if result.RowsAffected == 0 {
		var order models.Order
		if err := oc.DB.First(&order, c.Param("id")).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch order"})
			return
		}
	}

	var order models.Order
	if err := oc.DB.Preload("OrderItems.Product").Preload("User").First(&order, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load updated order"})
		return
	}
	c.JSON(http.StatusOK, order)
}

type salesAnalyticsSummary struct {
	Orders    int64 `json:"orders"`
	Revenue   int64 `json:"revenue"`
	Confirmed int64 `json:"confirmed_orders"`
	Pending   int64 `json:"pending_orders"`
	Cancelled int64 `json:"cancelled_orders"`
}

type salesAnalyticsDaily struct {
	Date    string `json:"date"`
	Orders  int64  `json:"orders"`
	Revenue int64  `json:"revenue"`
}

type salesAnalyticsProduct struct {
	ProductID uint   `json:"product_id"`
	Name      string `json:"name"`
	Image     string `json:"image"`
	Quantity  int64  `json:"quantity"`
	Revenue   int64  `json:"revenue"`
}

func (oc *OrderController) GetSalesAnalytics(c *gin.Context) {
	days, err := parseAnalyticsDays(c.Query("days"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	now := time.Now()
	end := now.Truncate(24*time.Hour).AddDate(0, 0, 1)
	start := end.AddDate(0, 0, -days)
	revenueStatuses := []string{"paid", "processed", "shipped", "completed"}

	var summary salesAnalyticsSummary
	if err := oc.DB.Model(&models.Order{}).
		Select(`COUNT(*) AS orders,
			COALESCE(SUM(CASE WHEN LOWER(status) IN ? THEN total_price ELSE 0 END), 0) AS revenue,
			COALESCE(SUM(CASE WHEN LOWER(status) IN ? THEN 1 ELSE 0 END), 0) AS confirmed_orders,
			COALESCE(SUM(CASE WHEN LOWER(status) = 'pending' THEN 1 ELSE 0 END), 0) AS pending_orders,
			COALESCE(SUM(CASE WHEN LOWER(status) = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled_orders`,
			revenueStatuses, revenueStatuses).
		Where("created_at >= ? AND created_at < ?", start, end).
		Scan(&summary).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load sales summary"})
		return
	}

	var dailyRows []salesAnalyticsDaily
	if err := oc.DB.Model(&models.Order{}).
		Select(`DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
			COUNT(*) AS orders,
			COALESCE(SUM(CASE WHEN LOWER(status) IN ? THEN total_price ELSE 0 END), 0) AS revenue`,
			revenueStatuses).
		Where("created_at >= ? AND created_at < ?", start, end).
		Group("DATE_FORMAT(created_at, '%Y-%m-%d')").
		Order("DATE_FORMAT(created_at, '%Y-%m-%d') ASC").
		Scan(&dailyRows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load daily sales"})
		return
	}
	dailyByDate := make(map[string]salesAnalyticsDaily, len(dailyRows))
	for _, row := range dailyRows {
		dailyByDate[row.Date] = row
	}
	daily := make([]salesAnalyticsDaily, 0, days)
	for date := start; date.Before(end); date = date.AddDate(0, 0, 1) {
		key := date.Format("2006-01-02")
		row, exists := dailyByDate[key]
		if !exists {
			row.Date = key
		}
		daily = append(daily, row)
	}

	var topProducts []salesAnalyticsProduct
	if err := oc.DB.Table("order_items AS oi").
		Select(`p.id AS product_id, p.name, p.image,
			SUM(oi.quantity) AS quantity,
			SUM(oi.quantity * oi.price) AS revenue`).
		Joins("JOIN orders AS o ON o.id = oi.order_id").
		Joins("JOIN products AS p ON p.id = oi.product_id").
		Where("o.created_at >= ? AND o.created_at < ? AND LOWER(o.status) IN ?", start, end, revenueStatuses).
		Group("p.id, p.name, p.image").
		Order("quantity DESC, revenue DESC, p.name ASC").
		Limit(10).
		Scan(&topProducts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load top-selling products"})
		return
	}
	if topProducts == nil {
		topProducts = []salesAnalyticsProduct{}
	}

	c.JSON(http.StatusOK, gin.H{
		"days":         days,
		"start_date":   start.Format("2006-01-02"),
		"end_date":     end.AddDate(0, 0, -1).Format("2006-01-02"),
		"summary":      summary,
		"daily_sales":  daily,
		"top_products": topProducts,
	})
}

func parseAnalyticsDays(rawDays string) (int, error) {
	if rawDays == "" {
		return 7, nil
	}
	days, err := strconv.Atoi(rawDays)
	if err != nil || (days != 7 && days != 30) {
		return 0, errors.New("Days must be 7 or 30")
	}
	return days, nil
}
