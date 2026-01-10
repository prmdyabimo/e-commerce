package controllers

import (
	"fmt"
	"mini-ecommerce/config"
	"mini-ecommerce/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// =======================
// CREATE PRODUCT
// =======================
func CreateProduct(c *gin.Context) {
	var product models.Product

	// ambil data text
	product.Name = c.PostForm("name")
	product.Description = c.PostForm("description")

	price, err := strconv.Atoi(c.PostForm("price"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "price harus berupa angka"})
		return
	}
	product.Price = price

	stock, err := strconv.Atoi(c.PostForm("stock"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "stock harus berupa angka"})
		return
	}
	product.Stock = stock

	// =======================
	// ambil user_id dari JWT middleware
	// =======================
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	// JWT → float64
	uidFloat, ok := userID.(float64)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user id type"})
		return
	}
	product.UserID = uint(uidFloat)

	// =======================
	// ambil file gambar
	// =======================
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "gambar wajib di upload"})
		return
	}

	filename := fmt.Sprintf("%d_%s", time.Now().Unix(), file.Filename)
	filepath := "uploads/products/" + filename

	if err := c.SaveUploadedFile(file, filepath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal upload gambar"})
		return
	}

	product.Image = "/" + filepath

	// =======================
	// simpan ke database
	// =======================
	if err := config.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal menyimpan produk"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Produk berhasil dibuat",
		"data":    product,
	})
}

// =======================
// GET ALL PRODUCTS
// =======================
func GetProducts(c *gin.Context) {
	var products []models.Product

	config.DB.Find(&products)

	c.JSON(http.StatusOK, products)
}

// =======================
// GET PRODUCT BY ID
// =======================
func GetProductsByID(c *gin.Context) {
	var product models.Product
	id := c.Param("id")

	if err := config.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "produk tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, product)
}

// =======================
// UPDATE PRODUCT
// =======================
func UpdateProduct(c *gin.Context) {
	var product models.Product
	id := c.Param("id")

	if err := config.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "produk tidak ditemukan"})
		return
	}

	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config.DB.Save(&product)

	c.JSON(http.StatusOK, gin.H{
		"message": "Produk berhasil diupdate",
		"data":    product,
	})
}

// =======================
// DELETE PRODUCT
// =======================
func DeleteProduct(c *gin.Context) {
	var product models.Product
	id := c.Param("id")

	if err := config.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "produk tidak ditemukan"})
		return
	}

	config.DB.Delete(&product)

	c.JSON(http.StatusOK, gin.H{
		"message": "Produk berhasil dihapus",
	})
}
