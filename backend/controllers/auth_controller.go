package controllers

import (
	"mini-ecommerce/config"
	"mini-ecommerce/models"
	"mini-ecommerce/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

func Login(c *gin.Context) {
	var input models.User
	var user models.User

	//ambil email & password dari request
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"eror": err.Error()})
		return
	}
	//cari user berdasarkan email
	result := config.DB.Where("email = ?", input.Email).First(&user)
	if result.Error != nil {
		c.JSON(401, gin.H{"error": "Email tidak di temukan"})
		return
	}
	//cek password menggunakan hash
	if !utils.CheckPassword(user.Password, input.Password) {
		c.JSON(401, gin.H{"error": "Password Salah"})
		return
	}
	//buat token jwt
	token, _ := utils.GenerateToken(user.ID, user.Role)

	c.JSON(200, gin.H{
		"message": "Login Berhasil",
		"token":   token,
	})
}

func Register(c *gin.Context) {

	var user models.User

	// ambil JSON dari request
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}
	//set role
	user.Role = "user"

	//hash password
	hashsedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal hash password",
		})
		return
	}

	//ganti password asli dengan hash
	user.Password = hashsedPassword

	// simpan ke database
	config.DB.Create(&user)

	c.JSON(http.StatusOK, gin.H{
		"message": "Register berhasil",
	})
}
