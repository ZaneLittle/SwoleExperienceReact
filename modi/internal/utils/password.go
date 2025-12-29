// Package utils provides utilities for the Modi application.
package utils

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

var (
	// ErrInvalidHash is returned when the hash format is invalid.
	ErrInvalidHash = errors.New("invalid hash format")
	// ErrIncompatibleVersion is returned when the hash version is incompatible.
	ErrIncompatibleVersion = errors.New("incompatible version of argon2")
)

// HashPassword creates an Argon2id hash of a password.
func HashPassword(password string) (string, error) {
	// Argon2id parameters
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("failed to generate salt: %w", err)
	}

	// Recommended parameters for Argon2id (OPSLIMIT_MODERATE from libsodium)
	// Time: 2, Memory: 64MB, Threads: 4
	hash := argon2.IDKey([]byte(password), salt, 2, 64*1024, 4, 32)

	// Encode in the format: $argon2id$v=19$m=65536,t=2,p=4$salt$hash
	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)
	encodedHash := fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version, 64*1024, 2, 4, b64Salt, b64Hash)

	return encodedHash, nil
}

// VerifyPassword verifies a password against an Argon2id hash.
func VerifyPassword(password, encodedHash string) (bool, error) {
	parts := strings.Split(encodedHash, "$")
	if len(parts) != 6 {
		return false, ErrInvalidHash
	}

	if parts[1] != "argon2id" {
		return false, ErrInvalidHash
	}

	var version int
	_, err := fmt.Sscanf(parts[2], "v=%d", &version)
	if err != nil {
		return false, ErrInvalidHash
	}
	if version != argon2.Version {
		return false, ErrIncompatibleVersion
	}

	var memory, timeCost uint32
	var parallelism uint8
	_, err = fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &memory, &timeCost, &parallelism)
	if err != nil {
		return false, ErrInvalidHash
	}

	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return false, ErrInvalidHash
	}

	hash, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return false, ErrInvalidHash
	}

	hashLen := len(hash)
	if hashLen > 0x7FFFFFFF { // Max int32 value
		return false, ErrInvalidHash
	}
	otherHash := argon2.IDKey([]byte(password), salt, timeCost, memory, parallelism, uint32(hashLen))

	return subtle.ConstantTimeCompare(hash, otherHash) == 1, nil
}
