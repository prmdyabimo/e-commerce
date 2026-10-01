package controllers

import (
	"errors"
	"net/http"
	"strings"

	"mini-ecommerce/models"
	"mini-ecommerce/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserController struct {
	DB *gorm.DB
}

func NewUserController(db *gorm.DB) *UserController {
	return &UserController{DB: db}
}

type createUserRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Role     string `json:"role"`
}

type updateUserRequest struct {
	Name  *string `json:"name"`
	Email *string `json:"email" binding:"omitempty,email"`
	Role  *string `json:"role" binding:"omitempty,oneof=user admin"`
}

func (uc *UserController) GetAll(c *gin.Context) {
	var users []models.User
	if err := uc.DB.Order("id DESC").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	c.JSON(http.StatusOK, users)
}

func (uc *UserController) GetByID(c *gin.Context) {
	var user models.User
	if err := uc.DB.First(&user, c.Param("id")).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func (uc *UserController) Create(c *gin.Context) {
	var input createUserRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role := input.Role
	if role == "" {
		role = "user"
	}
	if role != "user" && role != "admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role must be user or admin"})
		return
	}

	user := models.User{
		Name:  strings.TrimSpace(input.Name),
		Email: strings.ToLower(strings.TrimSpace(input.Email)),
		Role:  role,
	}
	if user.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}

	password, err := utils.HashPassword(input.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}
	user.Password = password

	if err := uc.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Failed to create user; email may already be registered"})
		return
	}
	c.JSON(http.StatusCreated, user)
}

func (uc *UserController) Update(c *gin.Context) {
	var input updateUserRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var currentUser models.User
	if err := uc.DB.First(&currentUser, c.Param("id")).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}
	updates := make(map[string]interface{})
	if input.Name != nil {
		name := strings.TrimSpace(*input.Name)
		if name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Name cannot be empty"})
			return
		}
		updates["name"] = name
	}
	if input.Email != nil {
		email := strings.ToLower(strings.TrimSpace(*input.Email))
		if email == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email cannot be empty"})
			return
		}
		updates["email"] = email
	}
	if input.Role != nil {
		role := strings.ToLower(strings.TrimSpace(*input.Role))
		if role != "user" && role != "admin" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Role must be user or admin"})
			return
		}
		if role == "user" && currentUser.ID == authenticatedUserID(c) && currentUser.Role == "admin" {
			c.JSON(http.StatusConflict, gin.H{"error": "You cannot remove administrator access from your own account"})
			return
		}
		if role == "user" && currentUser.Role == "admin" {
			var adminCount int64
			if err := uc.DB.Model(&models.User{}).Where("role = ?", "admin").Count(&adminCount).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify administrator accounts"})
				return
			}
			if adminCount <= 1 {
				c.JSON(http.StatusConflict, gin.H{"error": "The last administrator account cannot be demoted"})
				return
			}
		}
		updates["role"] = role
	}
	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No user fields provided"})
		return
	}

	result := uc.DB.Model(&models.User{}).Where("id = ?", c.Param("id")).Updates(updates)
	if result.Error != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Failed to update user; email may already be registered"})
		return
	}
	if result.RowsAffected == 0 {
		var user models.User
		if err := uc.DB.First(&user, c.Param("id")).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
	}

	var user models.User
	if err := uc.DB.First(&user, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated user"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func authenticatedUserID(c *gin.Context) uint {
	userID, ok := c.Get("user_id")
	if !ok {
		return 0
	}
	id, ok := userID.(uint)
	if !ok {
		return 0
	}
	return id
}

func (uc *UserController) Delete(c *gin.Context) {
	var user models.User
	if err := uc.DB.First(&user, c.Param("id")).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	if authenticatedUserID(c) == user.ID {
		c.JSON(http.StatusConflict, gin.H{"error": "You cannot delete your own account"})
		return
	}
	if user.Role == "admin" {
		var adminCount int64
		if err := uc.DB.Model(&models.User{}).Where("role = ?", "admin").Count(&adminCount).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify administrator accounts"})
			return
		}
		if adminCount <= 1 {
			c.JSON(http.StatusConflict, gin.H{"error": "The last administrator account cannot be deleted"})
			return
		}
	}

	result := uc.DB.Delete(&user)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
}
