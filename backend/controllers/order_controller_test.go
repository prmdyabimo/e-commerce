package controllers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestIsValidOrderStatus(t *testing.T) {
	tests := []struct {
		status string
		valid  bool
	}{
		{status: "pending", valid: true},
		{status: "PAID", valid: true},
		{status: " processed ", valid: true},
		{status: "shipped", valid: true},
		{status: "completed", valid: true},
		{status: "cancelled", valid: true},
		{status: "", valid: false},
		{status: "unknown", valid: false},
	}

	for _, test := range tests {
		if got := isValidOrderStatus(test.status); got != test.valid {
			t.Errorf("isValidOrderStatus(%q) = %t, want %t", test.status, got, test.valid)
		}
	}
}

func TestParseAnalyticsDays(t *testing.T) {
	tests := []struct {
		input string
		want  int
		valid bool
	}{
		{input: "", want: 7, valid: true},
		{input: "7", want: 7, valid: true},
		{input: "30", want: 30, valid: true},
		{input: "1", valid: false},
		{input: "90", valid: false},
		{input: "abc", valid: false},
	}

	for _, test := range tests {
		got, err := parseAnalyticsDays(test.input)
		if (err == nil) != test.valid {
			t.Errorf("parseAnalyticsDays(%q) error = %v, valid = %t", test.input, err, test.valid)
			continue
		}
		if test.valid && got != test.want {
			t.Errorf("parseAnalyticsDays(%q) = %d, want %d", test.input, got, test.want)
		}
	}
}

func TestGetSalesAnalyticsRejectsUnsupportedDateRange(t *testing.T) {
	gin.SetMode(gin.TestMode)
	controller := NewOrderController(nil)
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest(http.MethodGet, "/admin/analytics?days=90", nil)

	controller.GetSalesAnalytics(context)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}
}
