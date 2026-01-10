package controllers

import (
	"errors"
	"fmt"
	"mini-ecommerce/config"
	"mini-ecommerce/models"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func requireUserID(c *gin.Context) (uint, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return 0, false
	}

	uidFloat, ok := userID.(float64)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user id type"})
		return 0, false
	}

	return uint(uidFloat), true
}

// =======================
// CREATE PRODUCT
// =======================
func CreateProduct(c *gin.Context) {
	var product models.Product
	contentType := c.ContentType()
	if strings.HasPrefix(contentType, "application/json") {
		var payload struct {
			Name        string `json:"name"`
			Description string `json:"description"`
			Price       int    `json:"price"`
			Stock       int    `json:"stock"`
			Image       string `json:"image"`
		}
		if err := c.ShouldBindJSON(&payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		name := strings.TrimSpace(payload.Name)
		if name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name wajib diisi"})
			return
		}
		if payload.Price <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "price harus lebih besar dari 0"})
			return
		}
		if payload.Stock < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "stock tidak boleh negatif"})
			return
		}
		image := strings.TrimSpace(payload.Image)
		if image == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "image wajib diisi"})
			return
		}

		product.Name = name
		product.Description = strings.TrimSpace(payload.Description)
		product.Price = payload.Price
		product.Stock = payload.Stock
		product.Image = image
	} else {
		// ambil data text
		name := strings.TrimSpace(c.PostForm("name"))
		if name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name wajib diisi"})
			return
		}
		product.Name = name
		product.Description = strings.TrimSpace(c.PostForm("description"))

		price, err := strconv.Atoi(strings.TrimSpace(c.PostForm("price")))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "price harus berupa angka"})
			return
		}
		if price <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "price harus lebih besar dari 0"})
			return
		}
		product.Price = price

		stock, err := strconv.Atoi(strings.TrimSpace(c.PostForm("stock")))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "stock harus berupa angka"})
			return
		}
		if stock < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "stock tidak boleh negatif"})
			return
		}
		product.Stock = stock

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
	}

	userID, ok := requireUserID(c)
	if !ok {
		return
	}
	product.UserID = userID

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

	contentType := c.ContentType()
	if !strings.HasPrefix(contentType, "application/json") {
		name := strings.TrimSpace(c.PostForm("name"))
		if name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name wajib diisi"})
			return
		}

		price, err := strconv.Atoi(strings.TrimSpace(c.PostForm("price")))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "price harus berupa angka"})
			return
		}
		if price <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "price harus lebih besar dari 0"})
			return
		}

		stock, err := strconv.Atoi(strings.TrimSpace(c.PostForm("stock")))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "stock harus berupa angka"})
			return
		}
		if stock < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "stock tidak boleh negatif"})
			return
		}

		product.Name = name
		product.Description = strings.TrimSpace(c.PostForm("description"))
		product.Price = price
		product.Stock = stock

		file, err := c.FormFile("image")
		if err == nil {
			filename := fmt.Sprintf("%d_%s", time.Now().Unix(), file.Filename)
			filepath := "uploads/products/" + filename
			if err := c.SaveUploadedFile(file, filepath); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal upload gambar"})
				return
			}
			product.Image = "/" + filepath
		} else if !errors.Is(err, http.ErrMissingFile) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "gambar tidak valid"})
			return
		} else if strings.TrimSpace(product.Image) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "image wajib diisi"})
			return
		}
	} else {
		var payload struct {
			Name        *string `json:"name"`
			Description *string `json:"description"`
			Price       *int    `json:"price"`
			Stock       *int    `json:"stock"`
			Image       *string `json:"image"`
		}
		if err := c.ShouldBindJSON(&payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if payload.Name == nil && payload.Description == nil && payload.Price == nil && payload.Stock == nil && payload.Image == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "tidak ada data untuk diupdate"})
			return
		}

		if payload.Name != nil {
			name := strings.TrimSpace(*payload.Name)
			if name == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "name wajib diisi"})
				return
			}
			product.Name = name
		}
		if payload.Description != nil {
			product.Description = strings.TrimSpace(*payload.Description)
		}
		if payload.Price != nil {
			if *payload.Price <= 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "price harus lebih besar dari 0"})
				return
			}
			product.Price = *payload.Price
		}
		if payload.Stock != nil {
			if *payload.Stock < 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "stock tidak boleh negatif"})
				return
			}
			product.Stock = *payload.Stock
		}
		if payload.Image != nil {
			image := strings.TrimSpace(*payload.Image)
			if image == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "image wajib diisi"})
				return
			}
			product.Image = image
		}
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
