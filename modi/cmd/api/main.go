// Package main is the entry point for the Modi API server.
package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ZaneLittle/modi/internal/config"
	"github.com/ZaneLittle/modi/internal/handlers"
	"github.com/ZaneLittle/modi/internal/middleware"
	"github.com/ZaneLittle/modi/internal/repositories"
	"github.com/ZaneLittle/modi/internal/services"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
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

	// Configure CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // In production, specify exact origins
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization", "Accept", "X-Request-ID"},
		ExposeHeaders:    []string{"Content-Length", "X-Request-ID", "X-Timestamp", "X-Server-Timestamp", "X-Rate-Limit-Limit", "X-Rate-Limit-Remaining", "X-Rate-Limit-Reset"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Health check endpoint (public)
	healthHandler := handlers.NewHealthHandler(db, redisClient)
	r.GET("/health", healthHandler.Health)

	// API v1 routes
	api := r.Group("/api/v1")
	{
		// Auth routes (public)
		if db != nil && redisClient != nil && cfg.JWTSecret != "" {
			userRepo := repositories.NewUserRepository(db)
			authService := services.NewAuthService(userRepo, redisClient, cfg.JWTSecret)
			authHandler := handlers.NewAuthHandler(authService)

			authGroup := api.Group("/auth")
			{
				authGroup.POST("/register", authHandler.Register)
				authGroup.POST("/login", authHandler.Login)
				authGroup.POST("/refresh", authHandler.Refresh)
				authGroup.POST("/logout", authHandler.Logout)
			}

			// Protected routes (require authentication)
			protected := api.Group("")
			protected.Use(middleware.AuthMiddleware(cfg))
			{
				protected.DELETE("/auth/account", authHandler.DeleteAccount)

				// Workout routes
				if db != nil {
					workoutRepo := repositories.NewWorkoutRepository(db)
					workoutService := services.NewWorkoutService(workoutRepo)
					workoutHandler := handlers.NewWorkoutHandler(workoutService)

					workoutsGroup := protected.Group("/workouts")
					{
						workoutsGroup.GET("", workoutHandler.GetWorkouts)
						workoutsGroup.POST("", workoutHandler.CreateWorkout)
						workoutsGroup.GET("/:id", workoutHandler.GetWorkout)
						workoutsGroup.PUT("/:id", workoutHandler.UpdateWorkout)
						workoutsGroup.DELETE("/:id", workoutHandler.DeleteWorkout)
					}
				} else {
					log.Println("Warning: Database not configured. Workout endpoints disabled.")
				}
			}
		} else {
			log.Println("Warning: Database, Redis, or JWT_SECRET not configured. Auth endpoints disabled.")
		}
	}

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
		if err := redisClient.Close(); err != nil {
			log.Printf("Error closing Redis connection: %v", err)
		}
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
