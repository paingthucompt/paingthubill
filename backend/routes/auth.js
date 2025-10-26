const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../db");
const config = require("../config");

const router = express.Router();
const JWT_SECRET = config.JWT_SECRET;
const REFRESH_TOKEN_SECRET = config.REFRESH_TOKEN_SECRET;

// Get current user session
router.get("/session", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { rows } = await query(
      `SELECT id, email, role, subscription_status, subscription_end_date 
       FROM users WHERE id = $1`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = rows[0];
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      subscription: {
        status: user.subscription_status,
        expiryDate: user.subscription_end_date
      }
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    console.error("Session error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const { rows } = await query(
      `SELECT id, email, password_hash, role, subscription_status, subscription_end_date 
       FROM users WHERE email = $1`,
      [email]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Admin users don't need subscription check
    if (user.role === 'admin') {
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: "24h" }  // Increase token expiry for admin
      );

      // Generate refresh token
      const refreshToken = jwt.sign(
        { id: user.id },
        REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
      );

      // Store refresh token in database
      await query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at) 
         VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
        [user.id, refreshToken]
      );

      return res.json({
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isAdmin: true,
          subscription: {
            status: 'active',
            endDate: user.subscription_end_date
          }
        }
      });
    }

    // Regular users need subscription check
    const isActive = user.subscription_status === "active";
    const expiryDate = user.subscription_end_date
      ? new Date(user.subscription_end_date)
      : null;
    const isExpired = expiryDate !== null && expiryDate <= new Date();

    if (!isActive || isExpired) {
      return res
        .status(403)
        .json({ message: "Your account is suspended or has expired." });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Generate refresh token for regular users too
    const refreshToken = jwt.sign(
      { id: user.id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, refreshToken]
    );

    // Include user info in response
    return res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        subscription: {
          status: user.subscription_status,
          expiryDate: user.subscription_end_date
        }
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// Change password endpoint
router.post("/change-password", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { currentPassword, newPassword } = req.body;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current and new passwords are required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { rows } = await query(
      "SELECT id, password_hash FROM users WHERE id = $1",
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!passwordMatches) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [hashedPassword, user.id]
    );

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    console.error("Change password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Refresh token endpoint
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    // Check if token exists and is not revoked
    const { rows } = await query(
      `SELECT rt.*, u.email, u.role, u.subscription_status, u.subscription_end_date 
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token = $1 AND rt.revoked = FALSE`,
      [refreshToken]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const tokenData = rows[0];

    // Check if token is expired
    if (new Date(tokenData.expires_at) <= new Date()) {
      // Revoke expired token
      await query(
        "UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1",
        [refreshToken]
      );
      return res.status(401).json({ message: "Refresh token expired" });
    }

    // Generate new access token
    const newToken = jwt.sign(
      {
        id: tokenData.user_id,
        email: tokenData.email,
        role: tokenData.role,
      },
      JWT_SECRET,
      { expiresIn: tokenData.role === 'admin' ? '24h' : '1h' }
    );

    // Generate new refresh token
    const newRefreshToken = jwt.sign(
      { id: tokenData.user_id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // Revoke old refresh token
    await query(
      "UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1",
      [refreshToken]
    );

    // Store new refresh token
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [tokenData.user_id, newRefreshToken]
    );

    // Return new tokens
    return res.json({
      token: newToken,
      refreshToken: newRefreshToken,
      user: {
        id: tokenData.user_id,
        email: tokenData.email,
        role: tokenData.role,
        isAdmin: tokenData.role === 'admin',
        subscription: {
          status: tokenData.subscription_status,
          endDate: tokenData.subscription_end_date
        }
      }
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    console.error("Refresh token error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Logout endpoint
router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  try {
    // Revoke refresh token
    await query(
      "UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1",
      [refreshToken]
    );

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
