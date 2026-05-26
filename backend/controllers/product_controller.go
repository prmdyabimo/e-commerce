package controllers

import (
	"fmt"
	"net/http"

	"mini-ecommerce/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ProductController struct {
	DB *gorm.DB
}

// constructor
func NewProductController(db *gorm.DB) *ProductController {
	return &ProductController{DB: db}
}

// =======================
// CREATE PRODUCT
// =======================
func (pc *ProductController) Create(c *gin.Context) {
	var product models.Product

	// bind raw json to struct
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// save to database
	if err := pc.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// take relation category
	pc.DB.Preload("Category").First(&product, product.ID)

	c.JSON(http.StatusCreated, product)
}

// =======================
// GET ALL PRODUCTS
// =======================
func (pc *ProductController) GetAll(c *gin.Context) {
	var products []models.Product
	pc.DB.Preload("Category").Find(&products)
	c.JSON(http.StatusOK, products)
}

// =======================
// GET PRODUCT BY ID
// =======================
func (pc *ProductController) GetByID(c *gin.Context) {
	var product models.Product
	id := c.Param("id")

	if err := pc.DB.Preload("Category").First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	c.JSON(http.StatusOK, product)
}

// =======================
// UPDATE PRODUCT
// =======================
func (pc *ProductController) Update(c *gin.Context) {
	var product models.Product
	id := c.Param("id")

	// cek produk ada atau tidak
	if err := pc.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Product not found",
		})
		return
	}

	// take data from form data
	name := c.PostForm("name")
	price := c.PostForm("price")
	description := c.PostForm("description")
	stock := c.PostForm("stock")
	categoryID := c.PostForm("category_id")

	// update field
	product.Name = name
	product.Description = description

	fmt.Sscanf(price, "%d", &product.Price)
	fmt.Sscanf(stock, "%d", &product.Stock)
	fmt.Sscanf(categoryID, "%d", &product.CategoryID)

	// check image new
	file, err := c.FormFile("image")

	if err == nil {
		imagePath := "uploads/products/" + file.Filename

		if err := c.SaveUploadedFile(file, imagePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to upload image",
			})
			return
		}

		product.Image = imagePath
	}

	//save update
	if err := pc.DB.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update product",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Update product success",
		"data":    product,
	})
}

// =======================
// DELETE PRODUCT
// =======================
func (pc *ProductController) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := pc.DB.Delete(&models.Product{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Successfully delete product",
	})
}
