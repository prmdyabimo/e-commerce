package models

import "time"

//category represents the categories table in the database
type Category struct {
	//ID primary key (auto increment), Name category, must be filled in and must be unique, automatic timestamp from gorm(create_at and update_at)
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"type:varchar(100);not null;unique" json:"name"`
	CreatedAt time.Time `json:"create_at"`
	UpdatedAt time.Time `json:"update_at"`
	//one-to-many relationship, one category can have many products, "omitempty" so it doesn't appear if it's empty
	Products []Product `json:"products,omitempty"`
}
