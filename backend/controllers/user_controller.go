package controllers

import (
	"net/http"

	"mini-ecommerce/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserController struct {
	DB *gorm.DB
}

// constructor
func NewUserController(db *gorm.DB) *UserController {
	return &UserController{DB: db}
}

// =======================
// GET ALL USERS
// =======================
func (uc *UserController) GetAll(c *gin.Context) {
	var users []models.User
	uc.DB.Find(&users)
	c.JSON(http.StatusOK, users)
}

// =======================
// GET USER BY ID
// =======================
func (uc *UserController) GetByID(c *gin.Context) {
	var user models.User
	id := c.Param("id")

	if err := uc.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// =======================
// DELETE USER
// =======================
func (uc *UserController) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := uc.DB.Delete(&models.User{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal hapus user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User berhasil dihapus",
	})
}
