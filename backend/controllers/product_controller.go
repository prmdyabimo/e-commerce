package controllers

import (
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

	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := pc.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, product)
}

// =======================
// GET ALL PRODUCTS
// =======================
func (pc *ProductController) GetAll(c *gin.Context) {
	var products []models.Product
	pc.DB.Find(&products)
	c.JSON(http.StatusOK, products)
}

// =======================
// GET PRODUCT BY ID
// =======================
func (pc *ProductController) GetByID(c *gin.Context) {
	var product models.Product
	id := c.Param("id")

	if err := pc.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "produk tidak ditemukan"})
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

	if err := pc.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "produk tidak ditemukan"})
		return
	}

	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pc.DB.Save(&product)

	c.JSON(http.StatusOK, gin.H{
		"message": "Produk berhasil diupdate",
		"data":    product,
	})
}

// =======================
// DELETE PRODUCT
// =======================
func (pc *ProductController) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := pc.DB.Delete(&models.Product{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal hapus produk"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Produk berhasil dihapus",
	})
}
