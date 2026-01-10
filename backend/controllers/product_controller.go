package controllers

import (
	"fmt"
	"mini-ecommerce/config"
	"mini-ecommerce/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// create product
func CreateProduct(c *gin.Context) {
	var product models.Product

	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config.DB.Create(&product)

	c.JSON(http.StatusOK, gin.H{
		"message": "Produk Berhasil Ditambahkan",
		"data":    product,
	})
}

// get all product
func GetProducts(c *gin.Context) {
	var products []models.Product

	config.DB.Find(&products)

	c.JSON(http.StatusOK, products)
}

// get product by id
func GetProductsByID(c *gin.Context) {
	var product models.Product
	id := c.Param("id")

	fmt.Println(id)
	if err := config.DB.First(&product, id).Error; err != nil {
		c.JSON(404, gin.H{"error": "Produk Tidak Ditemukan"})
		return
	}

	c.JSON(http.StatusOK, product)
}

// update product
func UpdateProduct(c *gin.Context) {
	var product models.Product
	id := c.Param("id")

	if err := config.DB.First(&product, id).Error; err != nil {
		c.JSON(404, gin.H{"error": "Produk Tidak Ditemukan"})
		return
	}
	c.ShouldBindJSON(&product)
	config.DB.Save(&product)

	c.JSON(http.StatusOK, gin.H{
		"message": "Product berhasil di update",
	})
}

// delete product
func DeleteProduct(c *gin.Context) {
	var product models.Product
	id := c.Param("id")

	if err := config.DB.First(&product, id).Error; err != nil {
		c.JSON(404, gin.H{"error": "Produk Tidak Ditemukan"})
		return
	}

	config.DB.Delete(&product)

	c.JSON(http.StatusOK, gin.H{
		"message": "Produk Berhasil Dihapus",
	})
}
