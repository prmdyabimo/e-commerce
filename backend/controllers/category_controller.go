package controllers

import (
	"net/http"

	"mini-ecommerce/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// struct controller agar db bisa dipakai di semua method
type CategoryController struct {
	DB *gorm.DB
}

// constructor controller
func NewCategoryController(db *gorm.DB) *CategoryController {
	return &CategoryController{DB: db}
}

// Create category
func (cc *CategoryController) Create(c *gin.Context) {
	var category models.Category

	//ambil json dari request body dan mapping ke struct
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	//simpan ke databse
	if err := cc.DB.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	//response suskse
	c.JSON(http.StatusCreated, category)
}

// read all categgories
func (cc *CategoryController) FindAll(c *gin.Context) {
	var categories []models.Category

	//preload("products") = ambil category + produk di dalamnya
	cc.DB.Preload("Products").Find(&categories)

	c.JSON(http.StatusOK, categories)
}

// read category by id
func (cc *CategoryController) FindByID(c *gin.Context) {
	var category models.Category
	id := c.Param("id")

	//cari berdasarkan id + preload products
	if err := cc.DB.Preload("Products").First(&category, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Category Not Found",
		})
		return
	}
	c.JSON(http.StatusOK, category)
}

// update category
func (cc *CategoryController) Update(c *gin.Context) {
	var category models.Category
	id := c.Param("id")

	//cek apakah data ada
	if err := cc.DB.First(&category, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Category Not Found",
		})
		return
	}
	//ambil data baru dari request
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	//simpan perubahan
	cc.DB.Save(&category)

	c.JSON(http.StatusOK, category)
}

func (cc *CategoryController) Delete(c *gin.Context) {
	id := c.Param("id")

	//hapus berdasarkan id
	cc.DB.Delete(&models.Category{}, id)

	c.JSON(http.StatusOK, gin.H{
		"message": "Category Deleted",
	})
}
