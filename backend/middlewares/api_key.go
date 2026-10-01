package middlewares

import (
	"crypto/subtle"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func APIKeyMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		clientKey := c.GetHeader("X-API-Key")
		serverKey := os.Getenv("API_KEY")

		if clientKey == "" || serverKey == "" ||
			subtle.ConstantTimeCompare([]byte(clientKey), []byte(serverKey)) != 1 {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "Unauthorized - API Key Invalid",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
