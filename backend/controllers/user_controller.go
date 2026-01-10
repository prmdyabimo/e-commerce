package controllers

import (
    "mini-ecommerce/config"
    "mini-ecommerce/models"
    "net/http"

    "github.com/gin-gonic/gin"
)

// GetUsers returns all users (protected)
func GetUsers(c *gin.Context) {
    var users []models.User
    config.DB.Find(&users)
    c.JSON(http.StatusOK, users)
}

// UpdateUser updates a user's fields (name, email, password optional)
func UpdateUser(c *gin.Context) {
    var user models.User
    id := c.Param("id")

    if err := config.DB.First(&user, id).Error; err != nil {
        c.JSON(404, gin.H{"error": "User not found"})
        return
    }

    var input models.User
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Only update allowed fields
    if input.Name != "" {
        user.Name = input.Name
    }
    if input.Email != "" {
        user.Email = input.Email
    }
    // Note: password hashing/update not implemented here for simplicity

    config.DB.Save(&user)

    c.JSON(http.StatusOK, gin.H{"message": "User updated", "data": user})
}
