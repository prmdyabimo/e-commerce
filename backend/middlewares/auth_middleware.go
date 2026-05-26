package middlewares

import (
	"mini-ecommerce/utils"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		//get authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization does not exist",
			})
			c.Abort()
			return
		}

		//Authorization does not exist
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Wrong format token",
			})
			c.Abort()
			return
		}

		tokenString := parts[1]

		//parse and validasi token
		token, err := utils.ValidateToken(tokenString)
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Token does not valid",
			})
			c.Abort()
			return
		}

		//get claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Claims does not valid",
			})
			c.Abort()
			return
		}

		//save user id and role to context
		c.Set("user_id", claims["user_id"])
		c.Set("role", claims["role"])

		//next to controller
		c.Next()
	}
}
