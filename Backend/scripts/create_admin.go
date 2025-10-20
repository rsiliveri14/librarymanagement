package main

import (
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Must match main.go User struct
type User struct {
	ID       uint `gorm:"primaryKey"`
	Name     string
	Email    string `gorm:"unique"`
	Password string
	Role     string
}

func main() {
	// Same DSN as in main.go
	dsn := "host=localhost user=postgres password=postgres dbname=books port=5432 sslmode=disable"

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database:", err)
	}

	// Admin credentials
	email := "admin@example.com"
	password := "secret123" // change if you want
	name := "Admin"

	// Hash the password exactly once
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	if err != nil {
		log.Fatal("failed to hash password:", err)
	}

	admin := User{
		Name:     name,
		Email:    email,
		Password: string(hashed),
		Role:     "admin",
	}

	// Insert admin user
	if err := db.Create(&admin).Error; err != nil {
		log.Fatal("failed to insert admin:", err)
	}

	fmt.Println("✅ Admin created successfully")
	fmt.Println("Login with:")
	fmt.Println("Email:", email)
	fmt.Println("Password:", password)
}
