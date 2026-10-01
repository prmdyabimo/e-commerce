package utils

import (
	"strings"
	"testing"

	"github.com/golang-jwt/jwt/v5"
)

func TestJWTSecretMustBeConfigured(t *testing.T) {
	t.Setenv("JWT_SECRET", "")
	if err := ValidateJWTSecret(); err == nil {
		t.Fatal("expected an error when JWT_SECRET is missing")
	}

	t.Setenv("JWT_SECRET", "too-short")
	if err := ValidateJWTSecret(); err == nil {
		t.Fatal("expected an error when JWT_SECRET is too short")
	}
}

func TestGenerateAndValidateToken(t *testing.T) {
	t.Setenv("JWT_SECRET", strings.Repeat("x", 32))

	tokenString, err := GenerateToken(42, "user")
	if err != nil {
		t.Fatalf("GenerateToken() error = %v", err)
	}

	token, err := ValidateToken(tokenString)
	if err != nil {
		t.Fatalf("ValidateToken() error = %v", err)
	}
	if !token.Valid {
		t.Fatal("expected generated token to be valid")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		t.Fatal("expected JWT map claims")
	}
	if claims["role"] != "user" {
		t.Errorf("role claim = %v, want user", claims["role"])
	}
	if claims["user_id"] != float64(42) {
		t.Errorf("user_id claim = %v, want 42", claims["user_id"])
	}
}

func TestValidateTokenRejectsUnexpectedSigningMethod(t *testing.T) {
	t.Setenv("JWT_SECRET", strings.Repeat("x", 32))
	tokenString, err := jwt.NewWithClaims(jwt.SigningMethodNone, jwt.MapClaims{
		"user_id": 42,
		"role":    "admin",
	}).SignedString(jwt.UnsafeAllowNoneSignatureType)
	if err != nil {
		t.Fatalf("SignedString() error = %v", err)
	}

	if _, err := ValidateToken(tokenString); err == nil {
		t.Fatal("expected unsigned token to be rejected")
	}
}
