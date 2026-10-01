package controllers

import (
	"errors"
	"net/http"
	"strings"

	"mini-ecommerce/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CategoryController struct {
	DB *gorm.DB
}

func NewCategoryController(db *gorm.DB) *CategoryController {
	return &CategoryController{DB: db}
}

type categoryRequest struct {
	Name string `json:"name" binding:"required"`
}

func (cc *CategoryController) Create(c *gin.Context) {
	var input categoryRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	name := strings.TrimSpace(input.Name)
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category name is required"})
		return
	}

	category := models.Category{Name: name}
	if err := cc.DB.Create(&category).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Failed to create category; name may already exist"})
		return
	}
	c.JSON(http.StatusCreated, category)
}

func (cc *CategoryController) FindAll(c *gin.Context) {
	var categories []models.Category
	if err := cc.DB.Preload("Products").Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}
	c.JSON(http.StatusOK, categories)
}

func (cc *CategoryController) FindByID(c *gin.Context) {
	var category models.Category
	if err := cc.DB.Preload("Products").First(&category, c.Param("id")).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch category"})
		return
	}
	c.JSON(http.StatusOK, category)
}

func (cc *CategoryController) Update(c *gin.Context) {
	var input categoryRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	name := strings.TrimSpace(input.Name)
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category name is required"})
		return
	}

	result := cc.DB.Model(&models.Category{}).Where("id = ?", c.Param("id")).Update("name", name)
	if result.Error != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Failed to update category; name may already exist"})
		return
	}
	if result.RowsAffected == 0 {
		var existing models.Category
		if err := cc.DB.First(&existing, c.Param("id")).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch category"})
			return
		}
	}

	var category models.Category
	if err := cc.DB.First(&category, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated category"})
		return
	}
	c.JSON(http.StatusOK, category)
}

func (cc *CategoryController) Delete(c *gin.Context) {
	result := cc.DB.Delete(&models.Category{}, c.Param("id"))
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete category"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Category deleted"})
}
