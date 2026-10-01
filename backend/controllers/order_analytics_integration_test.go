package controllers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"mini-ecommerce/config"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func TestSalesAnalyticsWithMySQL(t *testing.T) {
	if os.Getenv("RUN_ANALYTICS_INTEGRATION") != "1" {
		t.Skip("set RUN_ANALYTICS_INTEGRATION=1 to query the configured MySQL database")
	}
	if os.Getenv("MYSQL_DSN") == "" {
		if err := godotenv.Load("../.env"); err != nil {
			t.Fatalf("load backend .env: %v", err)
		}
	}

	db, err := config.InitDB()
	if err != nil {
		t.Fatal(err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatal(err)
	}
	defer sqlDB.Close()

	gin.SetMode(gin.TestMode)
	for _, days := range []string{"7", "30"} {
		t.Run(days+" days", func(t *testing.T) {
			recorder := httptest.NewRecorder()
			context, _ := gin.CreateTestContext(recorder)
			context.Request = httptest.NewRequest(http.MethodGet, "/admin/analytics?days="+days, nil)

			NewOrderController(db).GetSalesAnalytics(context)

			if recorder.Code != http.StatusOK {
				t.Fatalf("status = %d, want %d: %s", recorder.Code, http.StatusOK, recorder.Body.String())
			}
			var response struct {
				Days        int                     `json:"days"`
				DailySales  []salesAnalyticsDaily   `json:"daily_sales"`
				TopProducts []salesAnalyticsProduct `json:"top_products"`
			}
			if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
				t.Fatalf("decode analytics response: %v", err)
			}
			if response.Days != len(response.DailySales) {
				t.Errorf("days = %d, daily sales rows = %d", response.Days, len(response.DailySales))
			}
			if response.TopProducts == nil {
				t.Error("top_products should be an empty array, not null, when no sales exist")
			}
		})
	}
}
