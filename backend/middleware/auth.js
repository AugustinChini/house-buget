const { getQuery, runQuery } = require("../database");

/**
 * Authentication middleware
 * Validates the Bearer token from Authorization header
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(403).json({
        error: "Access denied",
        message: "No authentication token provided",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(403).json({
        error: "Access denied",
        message: "Invalid authentication token format",
      });
    }

    // Check if token exists and is not expired
    const tokenRecord = await getQuery(
      'SELECT * FROM auth_tokens WHERE token = ? AND expiresAt > datetime("now")',
      [token]
    );

    if (!tokenRecord) {
      return res.status(403).json({
        error: "Access denied",
        message: "Invalid or expired token",
      });
    }

    // Token is valid, continue to next middleware/route
    req.authToken = token;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      error: "Authentication error",
      message: "An error occurred during authentication",
    });
  }
};

/**
 * Cleanup expired tokens from the database
 * Can be called periodically to remove stale tokens
 */
const cleanupExpiredTokens = async () => {
  try {
    const result = await runQuery(
      'DELETE FROM auth_tokens WHERE expiresAt <= datetime("now")'
    );
    if (result.changes > 0) {
      console.log(`Cleaned up ${result.changes} expired tokens`);
    }
    return result.changes;
  } catch (error) {
    console.error("Error cleaning up expired tokens:", error);
    return 0;
  }
};

// Run cleanup periodically (every hour)
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

module.exports = {
  authMiddleware,
  cleanupExpiredTokens,
};
