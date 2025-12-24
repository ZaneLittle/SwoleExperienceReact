package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/ZaneLittle/modi/internal/config"
	"github.com/ZaneLittle/modi/internal/handlers"
)

func main() {
	// Load configuration
	cfg := config.Load()
	
	log.Printf("Config loaded - Database URL: %s, Redis URL: %s", 
		maskURL(cfg.DatabaseURL), maskURL(cfg.RedisURL))

	// Initialize database connection
	var db *pgxpool.Pool
	if cfg.DatabaseURL != "" {
		var err error
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		db, err = pgxpool.New(ctx, cfg.DatabaseURL)
		if err != nil {
			log.Printf("Warning: Failed to connect to database: %v", err)
			log.Println("Continuing without database connection...")
		} else {
			// Test the connection
			if err := db.Ping(ctx); err != nil {
				log.Printf("Warning: Failed to ping database: %v", err)
				log.Println("Continuing without database connection...")
				db = nil
			} else {
				log.Println("Database connection established")
			}
		}
	} else {
		log.Println("Warning: DATABASE_URL not set, running without database")
	}

	// Initialize Redis connection
	var redisClient *redis.Client
	if cfg.RedisURL != "" {
		opt, err := redis.ParseURL(cfg.RedisURL)
		if err != nil {
			log.Printf("Warning: Failed to parse Redis URL: %v", err)
			log.Println("Continuing without Redis connection...")
		} else {
			redisClient = redis.NewClient(opt)
			// Test the connection
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if err := redisClient.Ping(ctx).Err(); err != nil {
				log.Printf("Warning: Failed to connect to Redis: %v", err)
				log.Println("Continuing without Redis connection...")
				redisClient = nil
			} else {
				log.Println("Redis connection established")
			}
		}
	} else {
		log.Println("Warning: REDIS_URL not set, running without Redis")
	}

	// Setup router
	r := gin.Default()

	// Health check endpoint
	healthHandler := handlers.NewHealthHandler(db, redisClient)
	r.GET("/health", healthHandler.Health)

	// TODO: Setup API routes
	// api := r.Group("/api/v1")
	// {
	//   api.POST("/auth/register", handlers.Register)
	//   api.POST("/auth/login", handlers.Login)
	//   ...
	// }

	// Graceful shutdown
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// Start server in goroutine
	srvPort := ":" + cfg.Port
	go func() {
		log.Printf("Starting Modi API server on %s", srvPort)
		if err := r.Run(srvPort); err != nil {
			log.Fatal("Failed to start server:", err)
		}
	}()

	// Wait for interrupt signal
	<-ctx.Done()
	log.Println("Shutting down server...")

	// Cleanup connections
	if db != nil {
		db.Close()
		log.Println("Database connection closed")
	}
	if redisClient != nil {
		redisClient.Close()
		log.Println("Redis connection closed")
	}

	log.Println("Server stopped")
}

// maskURL masks sensitive parts of URLs for logging
func maskURL(url string) string {
	if url == "" {
		return "(not set)"
	}
	// Simple masking - show first few chars and last few chars
	if len(url) > 20 {
		return url[:10] + "..." + url[len(url)-10:]
	}
	return url
}

