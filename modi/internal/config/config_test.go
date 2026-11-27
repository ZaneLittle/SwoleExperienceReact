package config

import "testing"

func TestConfigValidateProduction(t *testing.T) {
	valid := &Config{
		Env:                "production",
		DatabaseURL:        "postgres://user:password@postgres:5432/modi?sslmode=disable", // #nosec G101 -- test fixture
		RedisURL:           "redis://redis:6379/0",
		JWTSecret:          "01234567890123456789012345678901",
		CORSAllowedOrigins: []string{"https://app.example.com"},
	}
	if err := valid.Validate(); err != nil {
		t.Fatalf("valid production config was rejected: %v", err)
	}

	tests := []struct {
		name   string
		mutate func(*Config)
	}{
		{"missing origin", func(c *Config) { c.CORSAllowedOrigins = nil }},
		{"wildcard origin", func(c *Config) { c.CORSAllowedOrigins = []string{"*"} }},
		{"short JWT secret", func(c *Config) { c.JWTSecret = "too-short" }},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := *valid
			tt.mutate(&cfg)
			if err := cfg.Validate(); err == nil {
				t.Fatal("expected invalid production configuration")
			}
		})
	}
}
