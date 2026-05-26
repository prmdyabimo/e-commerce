package models

import "time"

type Order struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	UserID     uint   `json:"user_id"`
	TotalPrice int    `json:"total_price"`
	Status     string `gorm:"default:'pending'" json:"status"`
	Address    string `json:"address"`

	User       User        `gorm:"foreignKey:UserID" json:"user"`
	OrderItems []OrderItem `gorm:"foreignKey:OrderID" json:"order_items"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
