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

		//ambil authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization tidak ada",
			})
			c.Abort()
			return
		}

		//format harus : bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Format token salah",
			})
			c.Abort()
			return
		}

		tokenString := parts[1]

		//parse dan validasi token
		token, err := utils.ValidateToken(tokenString)
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Token Tidak Valid",
			})
			c.Abort()
			return
		}

		//ambil claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Claims Tidak Valid",
			})
			c.Abort()
			return
		}

		//simpan user id dan role ke context
		c.Set("user_id", claims["user_id"])
		c.Set("role", claims["role"])

		//lanjut ke controller
		c.Next()
	}
}
