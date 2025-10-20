package main

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// ================== CONFIG ==================

var jwtKey = []byte("super-secret-key")

func getEnv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func dsnFromEnv() string {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	pass := getEnv("DB_PASSWORD", "postgres")
	name := getEnv("DB_NAME", "books")
	ssl := getEnv("DB_SSLMODE", "disable")
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, pass, name, ssl)
}

func connectDBWithRetry() *gorm.DB {
	dsn := dsnFromEnv()
	var db *gorm.DB
	var err error
	for i := 0; i < 10; i++ {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			return db
		}
		log.Printf("Waiting for DB... (%v)", err)
		time.Sleep(2 * time.Second)
	}
	log.Fatal("Database connection failed:", err)
	return nil
}

func cors() gin.HandlerFunc {
	allowOrigin := getEnv("CORS_ALLOW_ORIGIN", "*")
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", allowOrigin)
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

// ================== JWT ==================

func generateToken(user User) (string, error) {
	claims := jwt.MapClaims{
		"id":   user.ID,
		"role": user.Role,
		"exp":  time.Now().Add(72 * time.Hour).Unix(),
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(jwtKey)
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := c.GetHeader("Authorization")
		if tokenStr == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			c.Abort()
			return
		}
		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return jwtKey, nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}
		claims := token.Claims.(jwt.MapClaims)
		userID := uint(claims["id"].(float64))
		c.Set("user_id", userID)
		c.Set("role", claims["role"])
		c.Next()
	}
}

func getRole(c *gin.Context) string {
	role, _ := c.Get("role")
	if s, ok := role.(string); ok {
		return s
	}
	return ""
}

func parseID(s string, c *gin.Context) (uint, bool) {
	id64, err := strconv.ParseUint(s, 10, 64)
	if err != nil || id64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return 0, false
	}
	return uint(id64), true
}

// ================== MODELS ==================

type User struct {
	ID       uint   `json:"id" gorm:"primaryKey;autoIncrement"`
	Name     string `json:"name"`
	Email    string `json:"email" gorm:"uniqueIndex"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

type Book struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Title     string    `json:"title"`
	Author    string    `json:"author"`
	Category  string    `json:"category"`
	Quantity  int       `json:"quantity"`
	CreatedAt time.Time `json:"created_at"`
}

type CartItem struct {
	ID       uint `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID   uint `json:"user_id" gorm:"index"`
	BookID   uint `json:"book_id" gorm:"index"`
	Quantity int  `json:"quantity"`
	Book     Book `json:"book" gorm:"foreignKey:BookID;references:ID"`
}

type Transaction struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    uint      `json:"user_id" gorm:"index"`
	BookID    uint      `json:"book_id" gorm:"index"`
	Quantity  int       `json:"quantity"`
	Type      string    `json:"type"` // checkout | return
	CreatedAt time.Time `json:"created_at"`
	User      User      `json:"user" gorm:"foreignKey:UserID;references:ID"`
	Book      Book      `json:"book" gorm:"foreignKey:BookID;references:ID"`
}

type Credentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// ================== MAIN ==================

func main() {
	db := connectDBWithRetry()
	if err := db.AutoMigrate(&User{}, &Book{}, &CartItem{}, &Transaction{}); err != nil {
		log.Fatal("Migration failed:", err)
	}

	r := gin.Default()
	r.Use(cors())

	// ---------- PUBLIC ----------
	r.POST("/register", func(c *gin.Context) {
		var in User
		if err := c.ShouldBindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		in.Role = "user"
		if err := db.Create(&in).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "email exists"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"message": "registered"})
	})

	r.POST("/login", func(c *gin.Context) {
		var creds Credentials
		if err := c.ShouldBindJSON(&creds); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid"})
			return
		}
		var user User
		if err := db.Where("email = ?", creds.Email).First(&user).Error; err != nil || user.Password != creds.Password {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
		token, _ := generateToken(user)
		c.JSON(http.StatusOK, gin.H{"token": token, "role": user.Role, "name": user.Name})
	})

	// ---------- BOOKS ----------
	r.GET("/books", func(c *gin.Context) {
		q := strings.TrimSpace(c.Query("q"))
		category := strings.TrimSpace(c.Query("category"))
		tx := db.Model(&Book{})
		if q != "" {
			pattern := "%" + q + "%"
			tx = tx.Where("title ILIKE ? OR author ILIKE ?", pattern, pattern)
		}
		if category != "" {
			tx = tx.Where("category ILIKE ?", category)
		}
		var books []Book
		tx.Order("title asc").Find(&books)
		c.JSON(http.StatusOK, books)
	})

	r.GET("/books/categories", func(c *gin.Context) {
		var cats []string
		db.Model(&Book{}).Distinct("category").Where("category <> ''").Pluck("category", &cats)
		c.JSON(http.StatusOK, cats)
	})

	// ---------- PROTECTED ----------
	auth := r.Group("/")
	auth.Use(authMiddleware())

	// --- Admin Book CRUD ---
	auth.POST("/books", func(c *gin.Context) {
		if getRole(c) != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "admin only"})
			return
		}
		var b Book
		if err := c.ShouldBindJSON(&b); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		db.Create(&b)
		c.JSON(http.StatusCreated, b)
	})

	auth.PUT("/books/:id", func(c *gin.Context) {
		if getRole(c) != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "admin only"})
			return
		}
		id, ok := parseID(c.Param("id"), c)
		if !ok {
			return
		}
		var in Book
		if err := c.ShouldBindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		db.Model(&Book{}).Where("id = ?", id).Updates(in)
		c.JSON(http.StatusOK, gin.H{"message": "book updated"})
	})

	auth.DELETE("/books/:id", func(c *gin.Context) {
		if getRole(c) != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "admin only"})
			return
		}
		id, ok := parseID(c.Param("id"), c)
		if !ok {
			return
		}
		db.Delete(&Book{}, id)
		c.JSON(http.StatusOK, gin.H{"message": "deleted"})
	})

	// --- CART / CHECKOUT / RETURNS ---

	// Add to cart (reserve stock, no transaction yet)
	auth.POST("/cart/add/:bookID", func(c *gin.Context) {
		if getRole(c) != "user" {
			c.JSON(http.StatusForbidden, gin.H{"error": "users only"})
			return
		}
		bookID, ok := parseID(c.Param("bookID"), c)
		if !ok {
			return
		}
		uid := c.MustGet("user_id").(uint)

		var book Book
		if err := db.First(&book, bookID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
			return
		}
		if book.Quantity <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "book not available"})
			return
		}

		var item CartItem
		err := db.Where("user_id = ? AND book_id = ?", uid, bookID).First(&item).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			item = CartItem{UserID: uid, BookID: bookID, Quantity: 1}
			db.Create(&item)
		} else if err == nil {
			item.Quantity++
			db.Save(&item)
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
			return
		}

		db.Model(&Book{}).Where("id = ?", bookID).UpdateColumn("quantity", gorm.Expr("quantity - 1"))
		c.JSON(http.StatusOK, gin.H{"message": "book added to cart"})
	})

	// Get cart
	auth.GET("/cart", func(c *gin.Context) {
		uid := c.MustGet("user_id").(uint)
		var cart []CartItem
		db.Preload("Book").Where("user_id = ?", uid).Find(&cart)
		c.JSON(http.StatusOK, cart)
	})

	// Decrease quantity / remove
	auth.POST("/cart/decrease/:bookID", func(c *gin.Context) {
		bookID, ok := parseID(c.Param("bookID"), c)
		if !ok {
			return
		}
		uid := c.MustGet("user_id").(uint)

		var item CartItem
		if err := db.Where("user_id = ? AND book_id = ?", uid, bookID).First(&item).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "item not found"})
			return
		}

		if item.Quantity > 1 {
			item.Quantity--
			db.Save(&item)
		} else {
			db.Delete(&item)
		}
		db.Model(&Book{}).Where("id = ?", bookID).UpdateColumn("quantity", gorm.Expr("quantity + 1"))
		c.JSON(http.StatusOK, gin.H{"message": "updated"})
	})

	// Delete item entirely
	auth.DELETE("/cart/delete/:bookID", func(c *gin.Context) {
		bookID, ok := parseID(c.Param("bookID"), c)
		if !ok {
			return
		}
		uid := c.MustGet("user_id").(uint)

		var item CartItem
		if err := db.Where("user_id = ? AND book_id = ?", uid, bookID).First(&item).Error; err == nil {
			// restore all reserved stock for this item
			db.Model(&Book{}).Where("id = ?", bookID).UpdateColumn("quantity", gorm.Expr("quantity + ?", item.Quantity))
			db.Delete(&item)
		}
		c.JSON(http.StatusOK, gin.H{"message": "item removed"})
	})

	// Checkout entire cart -> create transactions, clear cart
	auth.POST("/cart/checkout", func(c *gin.Context) {
		uid := c.MustGet("user_id").(uint)

		var cart []CartItem
		db.Preload("Book").Where("user_id = ?", uid).Find(&cart)
		if len(cart) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "cart empty"})
			return
		}

		for _, item := range cart {
			if item.Quantity <= 0 {
				continue
			}
			// Record checkout with quantity
			db.Create(&Transaction{
				UserID:   uid,
				BookID:   item.BookID,
				Quantity: item.Quantity,
				Type:     "checkout",
			})
		}
		// Clear cart (stock already reserved during adds)
		db.Where("user_id = ?", uid).Delete(&CartItem{})

		c.JSON(http.StatusOK, gin.H{"message": "checkout successful"})
	})

	// Return (supports partial returns with validation)
	// --- Return Book (with validation & partial returns) ---
	auth.POST("/cart/return/:bookID", func(c *gin.Context) {
		bookID, ok := parseID(c.Param("bookID"), c)
		if !ok {
			return
		}
		uid := c.MustGet("user_id").(uint)

		// Parse quantity
		var req struct {
			Quantity int `json:"quantity"`
		}
		if err := c.ShouldBindJSON(&req); err != nil || req.Quantity <= 0 {
			req.Quantity = 1
		}

		// Find how many were checked out and not yet returned
		var totalCheckedOut, totalReturned int64

		db.Model(&Transaction{}).
			Where("user_id = ? AND book_id = ? AND type = 'checkout'", uid, bookID).
			Select("COALESCE(SUM(quantity),0)").Scan(&totalCheckedOut)

		db.Model(&Transaction{}).
			Where("user_id = ? AND book_id = ? AND type = 'return'", uid, bookID).
			Select("COALESCE(SUM(quantity),0)").Scan(&totalReturned)

		currentHeld := totalCheckedOut - totalReturned
		if currentHeld <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "no active borrow to return"})
			return
		}
		if int64(req.Quantity) > currentHeld {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("You only have %d book(s) to return", currentHeld),
			})
			return
		}

		// Update book quantity & log return
		db.Model(&Book{}).
			Where("id = ?", bookID).
			UpdateColumn("quantity", gorm.Expr("quantity + ?", req.Quantity))

		db.Create(&Transaction{
			UserID:   uid,
			BookID:   bookID,
			Quantity: req.Quantity,
			Type:     "return",
		})

		c.JSON(http.StatusOK, gin.H{
			"message": fmt.Sprintf("%d book(s) returned successfully", req.Quantity),
		})
	})

	// --- HISTORY (user) ---
	auth.GET("/history", func(c *gin.Context) {
		uid := c.MustGet("user_id").(uint)
		var txns []Transaction
		db.Preload("Book").Where("user_id=?", uid).Order("created_at desc").Find(&txns)

		// Map the transactions into a flat JSON for the frontend
		history := []gin.H{}
		for _, t := range txns {
			history = append(history, gin.H{
				"book_id":    t.BookID,
				"book":       t.Book.Title,
				"author":     t.Book.Author,
				"quantity":   t.Quantity,
				"type":       t.Type,
				"created_at": t.CreatedAt.Format("2006-01-02 15:04:05"),
			})
		}

		c.JSON(http.StatusOK, history)
	})

	// --- USER HELD BOOKS (aggregate remaining per book) ---
	auth.GET("/user/held-books", func(c *gin.Context) {
		uid := c.MustGet("user_id").(uint)
		type row struct {
			BookID    uint   `json:"book_id"`
			Title     string `json:"title"`
			Author    string `json:"author"`
			Remaining int    `json:"remaining"`
		}
		var rows []row
		// Sum(checkout) - Sum(return) per book
		db.Raw(`
			SELECT
				b.id AS book_id,
				b.title,
				b.author,
				COALESCE(SUM(CASE WHEN t.type='checkout' THEN t.quantity ELSE 0 END),0)
				-
				COALESCE(SUM(CASE WHEN t.type='return' THEN t.quantity ELSE 0 END),0) AS remaining
			FROM transactions t
			JOIN books b ON b.id = t.book_id
			WHERE t.user_id = ?
			GROUP BY b.id, b.title, b.author
			HAVING (
				COALESCE(SUM(CASE WHEN t.type='checkout' THEN t.quantity ELSE 0 END),0)
				-
				COALESCE(SUM(CASE WHEN t.type='return' THEN t.quantity ELSE 0 END),0)
			) > 0
			ORDER BY b.title ASC
		`, uid).Scan(&rows)

		c.JSON(http.StatusOK, rows)
	})

	// --- PROFILE (user) ---
	auth.GET("/user/profile", func(c *gin.Context) {
		userID := c.MustGet("user_id").(uint)

		var user User
		db.First(&user, userID)

		var totalCheckouts, totalReturns int64
		db.Model(&Transaction{}).
			Where("user_id=? AND type='checkout'", userID).
			Select("COALESCE(SUM(quantity),0)").Scan(&totalCheckouts)
		db.Model(&Transaction{}).
			Where("user_id=? AND type='return'", userID).
			Select("COALESCE(SUM(quantity),0)").Scan(&totalReturns)

		var held int64
		db.Raw(`
			SELECT COALESCE(SUM(qq.qty),0) FROM (
				SELECT
					COALESCE(SUM(CASE WHEN t.type='checkout' THEN t.quantity ELSE 0 END),0)
					-
					COALESCE(SUM(CASE WHEN t.type='return' THEN t.quantity ELSE 0 END),0) AS qty
				FROM transactions t
				WHERE t.user_id=?
				GROUP BY t.book_id
			) qq
		`, userID).Scan(&held)

		c.JSON(http.StatusOK, gin.H{
			"user":  gin.H{"name": user.Name, "email": user.Email, "role": user.Role},
			"stats": gin.H{"checkouts": totalCheckouts, "returns": totalReturns, "held": held},
		})
	})

	// --- ADMIN: STATS (dashboard) ---
	auth.GET("/admin/stats", func(c *gin.Context) {
		if getRole(c) != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "admin only"})
			return
		}
		var totalUsers, totalBooks, totalCopies, checkouts, returns, borrowed int64
		db.Model(&User{}).Count(&totalUsers)
		db.Model(&Book{}).Count(&totalBooks)
		db.Model(&Book{}).Select("COALESCE(SUM(quantity),0)").Scan(&totalCopies)
		db.Model(&Transaction{}).Where("type='checkout'").Count(&checkouts)
		db.Model(&Transaction{}).Where("type='return'").Count(&returns)

		db.Raw(`
			SELECT COALESCE(SUM(qq.qty),0) FROM (
				SELECT
					COALESCE(SUM(CASE WHEN t.type='checkout' THEN t.quantity ELSE 0 END),0)
					-
					COALESCE(SUM(CASE WHEN t.type='return' THEN t.quantity ELSE 0 END),0) AS qty
				FROM transactions t
				GROUP BY t.user_id, t.book_id
			) qq
		`).Scan(&borrowed)

		c.JSON(http.StatusOK, gin.H{"totals": gin.H{
			"users":              totalUsers,
			"books":              totalBooks,
			"total_copies":       totalCopies,
			"checkouts":          checkouts,
			"returns":            returns,
			"currently_borrowed": borrowed,
		}})

	})

	// --- ADMIN: HISTORY ---
	auth.GET("/admin/history", func(c *gin.Context) {
		if getRole(c) != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "admin only"})
			return
		}
		var list []Transaction
		db.Preload("User").Preload("Book").Order("created_at desc").Find(&list)

		out := make([]gin.H, 0, len(list))
		for _, t := range list {
			out = append(out, gin.H{
				"user":       t.User.Name,
				"email":      t.User.Email,
				"book":       t.Book.Title,
				"author":     t.Book.Author,
				"quantity":   t.Quantity,
				"type":       t.Type,
				"created_at": t.CreatedAt.Format("2006-01-02 15:04:05"),
			})
		}
		c.JSON(http.StatusOK, out)
	})

	log.Println("✅ Server running on :8080")
	r.Run(":8080")
}
