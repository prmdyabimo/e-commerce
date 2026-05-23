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
	name := c.PostForm("name")
	price := c.PostForm("price")
	description := c.PostForm("description")
	stock := c.PostForm("stock")
	categoryID := c.PostForm("category_id")

	file, err := c.FormFile("image")

	var imagePath string

	if err == nil {
		imagePath = "uploads/products/" + file.Filename

		if err := c.SaveUploadedFile(file, imagePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Gagal upload gambar",
			})
			return
		}
	}

	product := models.Product{
		Name:        name,
		Description: description,
		Image:       imagePath,
	}

	fmt.Sscanf(price, "%d", &product.Price)
	fmt.Sscanf(stock, "%d", &product.Stock)
	fmt.Sscanf(categoryID, "%d", &product.CategoryID)

	if err := pc.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
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

	// cek produk ada atau tidak
	if err := pc.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "produk tidak ditemukan",
		})
		return
	}

	// ambil data dari form-data
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

	// cek apakah upload gambar baru
	file, err := c.FormFile("image")

	if err == nil {
		imagePath := "uploads/products/" + file.Filename

		if err := c.SaveUploadedFile(file, imagePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Gagal upload gambar",
			})
			return
		}

		product.Image = imagePath
	}

	// simpan update
	if err := pc.DB.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal update produk",
		})
		return
	}

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
