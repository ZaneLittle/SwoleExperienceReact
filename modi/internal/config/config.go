// Package config provides configuration management for the Modi application.
package config

import (
	"bufio"
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
)

// Config holds the application configuration.
type Config struct {
	Port               string
	Env                string
	DatabaseURL        string
	RedisURL           string
	JWTSecret          string
	LogLevel           string
	CORSAllowedOrigins []string
	TrustedProxyCIDRs  []string
	AuthRateLimit      int
}

// Load loads configuration from environment variables and .env file.
func Load() *Config {
	// Load .env file if it exists
	loadEnvFile(".env")

	return &Config{
		Port:               getEnv("PORT", "8080"),
		Env:                getEnv("ENV", "development"),
		DatabaseURL:        getEnv("DATABASE_URL", ""),
		RedisURL:           getEnv("REDIS_URL", ""),
		JWTSecret:          getEnv("JWT_SECRET", ""),
		LogLevel:           getEnv("LOG_LEVEL", "info"),
		CORSAllowedOrigins: splitCSV(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:8081,http://localhost:19006,http://localhost:42069")),
		TrustedProxyCIDRs:  splitCSV(getEnv("TRUSTED_PROXY_CIDRS", "")),
		AuthRateLimit:      getPositiveInt("AUTH_RATE_LIMIT_PER_MINUTE", 10),
	}
}

// Validate rejects unsafe production configuration before the server accepts traffic.
func (c *Config) Validate() error {
	if c.Env != "production" {
		return nil
	}

	if c.DatabaseURL == "" || c.RedisURL == "" {
		return fmt.Errorf("DATABASE_URL and REDIS_URL are required in production")
	}
	if len(c.JWTSecret) < 32 {
		return fmt.Errorf("JWT_SECRET must be at least 32 bytes in production")
	}
	if len(c.CORSAllowedOrigins) == 0 {
		return fmt.Errorf("CORS_ALLOWED_ORIGINS is required in production")
	}

	for _, origin := range c.CORSAllowedOrigins {
		parsed, err := url.ParseRequestURI(origin)
		if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" || parsed.Path != "" {
			return fmt.Errorf("CORS_ALLOWED_ORIGINS contains invalid origin %q", origin)
		}
		if origin == "*" {
			return fmt.Errorf("CORS_ALLOWED_ORIGINS cannot contain a wildcard in production")
		}
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func splitCSV(value string) []string {
	var values []string
	for _, item := range strings.Split(value, ",") {
		if trimmed := strings.TrimSpace(item); trimmed != "" {
			values = append(values, trimmed)
		}
	}
	return values
}

func getPositiveInt(key string, defaultValue int) int {
	value, err := strconv.Atoi(getEnv(key, ""))
	if err != nil || value < 1 {
		return defaultValue
	}
	return value
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
