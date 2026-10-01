package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"mini-ecommerce/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ProductController struct {
	DB *gorm.DB
}

func NewProductController(db *gorm.DB) *ProductController {
	return &ProductController{DB: db}
}

type createProductRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Price       int    `json:"price" binding:"required,gt=0"`
	Stock       int    `json:"stock" binding:"gte=0"`
	Image       string `json:"image"`
	CategoryID  uint   `json:"category_id" binding:"required"`
}

func (pc *ProductController) Create(c *gin.Context) {
	var input createProductRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.Name = strings.TrimSpace(input.Name)
	if input.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product name is required"})
		return
	}
	var category models.Category
	if err := pc.DB.First(&category, input.CategoryID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Category not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate category"})
		return
	}

	product := models.Product{
		Name:        input.Name,
		Description: input.Description,
		Price:       input.Price,
		Stock:       input.Stock,
		Image:       input.Image,
		CategoryID:  input.CategoryID,
	}
	if err := pc.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}
	if err := pc.DB.Preload("Category").First(&product, product.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Product created but failed to load its category"})
		return
	}
	c.JSON(http.StatusCreated, product)
}

func (pc *ProductController) GetAll(c *gin.Context) {
	var products []models.Product
	if err := pc.DB.Preload("Category").Order("id DESC").Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
		return
	}
	c.JSON(http.StatusOK, products)
}

func (pc *ProductController) GetByID(c *gin.Context) {
	var product models.Product
	if err := pc.DB.Preload("Category").First(&product, c.Param("id")).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch product"})
		return
	}
	c.JSON(http.StatusOK, product)
}

func (pc *ProductController) Update(c *gin.Context) {
	var product models.Product
	if err := pc.DB.First(&product, c.Param("id")).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch product"})
		return
	}

	name := strings.TrimSpace(c.PostForm("name"))
	price, err := strconv.Atoi(c.PostForm("price"))
	if err != nil || price <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Price must be a positive integer"})
		return
	}
	stock, err := strconv.Atoi(c.PostForm("stock"))
	if err != nil || stock < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Stock must be a non-negative integer"})
		return
	}
	categoryID, err := strconv.ParseUint(c.PostForm("category_id"), 10, 32)
	if err != nil || categoryID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "A valid category_id is required"})
		return
	}
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product name is required"})
		return
	}
	var category models.Category
	if err := pc.DB.First(&category, categoryID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Category not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate category"})
		return
	}

	product.Name = name
	product.Description = c.PostForm("description")
	product.Price = price
	product.Stock = stock
	product.CategoryID = uint(categoryID)

	file, err := c.FormFile("image")
	if err == nil {
		filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), filepath.Ext(file.Filename))
		imagePath := filepath.Join("uploads", "products", filename)
		if err := c.SaveUploadedFile(file, imagePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload image"})
			return
		}
		product.Image = filepath.ToSlash(imagePath)
	} else if !errors.Is(err, http.ErrMissingFile) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image upload"})
		return
	}

	if err := pc.DB.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
		return
	}
	if err := pc.DB.Preload("Category").First(&product, product.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Product updated but failed to load its category"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Update product success", "data": product})
}

func (pc *ProductController) Delete(c *gin.Context) {
	result := pc.DB.Delete(&models.Product{}, c.Param("id"))
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Successfully deleted product"})
}
