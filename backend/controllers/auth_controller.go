package controllers

import (
	"net/http"

	"mini-ecommerce/models"
	"mini-ecommerce/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AuthController struct {
	DB *gorm.DB
}

// constructor
func NewAuthController(db *gorm.DB) *AuthController {
	return &AuthController{DB: db}
}

// =======================
// LOGIN
// =======================
func (ac *AuthController) Login(c *gin.Context) {
	var input models.User
	var user models.User

	// ambil email & password
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// cari user berdasarkan email
	if err := ac.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email tidak ditemukan"})
		return
	}

	// cek password
	if !utils.CheckPassword(user.Password, input.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Password salah"})
		return
	}

	// generate JWT
	token, err := utils.GenerateToken(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login berhasil",
		"token":   token,
	})
}

// =======================
// REGISTER
// =======================
func (ac *AuthController) Register(c *gin.Context) {
	var user models.User

	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// cek email sudah terdaftar atau belum
	var existingUser models.User
	if err := ac.DB.Where("email = ?", user.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Email sudah terdaftar",
		})
		return
	}

	// set role default
	user.Role = "user"

	// hash password
	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal hash password",
		})
		return
	}
	user.Password = hashedPassword

	// simpan ke database
	if err := ac.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal register",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Register berhasil",
	})
}