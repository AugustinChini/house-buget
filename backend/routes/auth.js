const express = require("express");
const crypto = require("crypto");
const { runQuery, getQuery } = require("../database");

const router = express.Router();

// Token validity duration: 1 month in milliseconds
const TOKEN_VALIDITY_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * POST /auth/login
 * Validates PIN and returns a token
 */
router.post("/login", async (req, res) => {
  try {
    const { pin } = req.body;
    const correctPin = process.env.PIN_CODE;

    if (!correctPin) {
      console.error("PIN_CODE not configured in environment");
      return res.status(500).json({
        error: "Server configuration error",
        message: "Authentication is not properly configured",
      });
    }

    if (!pin) {
      return res.status(400).json({
        error: "Bad request",
        message: "PIN code is required",
      });
    }

    if (pin !== correctPin) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid PIN code",
      });
    }

    // Generate a secure random token
    const token = crypto.randomUUID();

    // Calculate expiry date (1 month from now)
    const expiresAt = new Date(Date.now() + TOKEN_VALIDITY_MS);

    // Store token in database
    await runQuery("INSERT INTO auth_tokens (token, expiresAt) VALUES (?, ?)", [
      token,
      expiresAt.toISOString(),
    ]);

    res.json({
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Server error",
      message: "An error occurred during login",
    });
  }
});

/**
 * POST /auth/logout
 * Invalidates the current token
 */
router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({
        error: "Bad request",
        message: "No token provided",
      });
    }

    const token = authHeader.substring(7);

    // Delete the token from database
    const result = await runQuery("DELETE FROM auth_tokens WHERE token = ?", [
      token,
    ]);

    if (result.changes === 0) {
      return res.status(404).json({
        error: "Not found",
        message: "Token not found or already invalidated",
      });
    }

    res.json({
      message: "Successfully logged out",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Server error",
      message: "An error occurred during logout",
    });
  }
});

/**
 * GET /auth/verify
 * Verifies if the current token is valid
 */
router.get("/verify", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(403).json({
        valid: false,
        message: "No token provided",
      });
    }

    const token = authHeader.substring(7);

    // Check if token exists and is not expired
    const tokenRecord = await getQuery(
      'SELECT expiresAt FROM auth_tokens WHERE token = ? AND expiresAt > datetime("now")',
      [token]
    );

    if (!tokenRecord) {
      return res.status(403).json({
        valid: false,
        message: "Invalid or expired token",
      });
    }

    res.json({
      valid: true,
      expiresAt: tokenRecord.expiresAt,
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({
      valid: false,
      message: "An error occurred during token verification",
    });
  }
});

module.exports = router;
