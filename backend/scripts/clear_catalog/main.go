package main

import (
	"fmt"
	"os"

	"mini-ecommerce/config"
	"mini-ecommerce/models"

	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

func main() {
	if err := godotenv.Load(); err != nil {
		fmt.Fprintf(os.Stderr, "load backend .env: %v\n", err)
		os.Exit(1)
	}

	db, err := config.InitDB()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	var deleted int64
	err = db.Transaction(func(tx *gorm.DB) error {
		result := tx.Where("id > 0").Delete(&models.Product{})
		if result.Error != nil {
			return fmt.Errorf("soft-delete catalog products: %w", result.Error)
		}
		deleted = result.RowsAffected
		return nil
	})
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	var remaining int64
	if err := db.Model(&models.Product{}).Count(&remaining).Error; err != nil {
		fmt.Fprintf(os.Stderr, "verify remaining active products: %v\n", err)
		os.Exit(1)
	}
	if remaining != 0 {
		fmt.Fprintf(os.Stderr, "catalog cleanup incomplete: %d active products remain\n", remaining)
		os.Exit(1)
	}

	fmt.Printf("Catalog cleared: %d products archived; %d active products remain.\n", deleted, remaining)
	fmt.Println("Order history, categories, and uploaded image files were left intact.")
}
