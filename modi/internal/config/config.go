// Package config provides configuration management for the Modi application.
package config

import (
	"bufio"
	"os"
	"strings"
)

// Config holds the application configuration.
type Config struct {
	Port        string
	Env         string
	DatabaseURL string
	RedisURL    string
	JWTSecret   string
	LogLevel    string
}

// Load loads configuration from environment variables and .env file.
func Load() *Config {
	// Load .env file if it exists
	loadEnvFile(".env")

	return &Config{
		Port:        getEnv("PORT", "8080"),
		Env:         getEnv("ENV", "development"),
		DatabaseURL: getEnv("DATABASE_URL", ""),
		RedisURL:    getEnv("REDIS_URL", ""),
		JWTSecret:   getEnv("JWT_SECRET", ""),
		LogLevel:    getEnv("LOG_LEVEL", "info"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// loadEnvFile loads environment variables from a .env file
func loadEnvFile(filename string) {
	file, err := os.Open(filename) // #nosec G304 -- filename is from caller, safe for .env files
	if err != nil {
		// .env file doesn't exist, that's okay
		return
	}
	defer func() {
		if err := file.Close(); err != nil {
			// Ignore close errors for .env files
			_ = err
		}
	}()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// Parse KEY=VALUE format
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])

			// Remove quotes if present
			if len(value) >= 2 && ((value[0] == '"' && value[len(value)-1] == '"') ||
				(value[0] == '\'' && value[len(value)-1] == '\'')) {
				value = value[1 : len(value)-1]
			}

			// Only set if not already in environment
			if os.Getenv(key) == "" {
				if err := os.Setenv(key, value); err != nil {
					// Ignore Setenv errors (shouldn't happen with valid keys)
					_ = err
				}
			}
		}
	}
}
