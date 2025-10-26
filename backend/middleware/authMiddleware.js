const jwt = require("jsonwebtoken");
const { query } = require("../db");
const config = require("../config");

const JWT_SECRET = config.JWT_SECRET;

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing authorization token." });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Missing authorization token." });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    const { rows } = await query(
      "SELECT id, email, role, subscription_status, subscription_end_date FROM users WHERE id = $1",
      [payload.id]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    // Skip subscription check for admin users
    if (user.role !== 'admin') {
      const subscriptionExpired =
        user.subscription_end_date !== null &&
        new Date(user.subscription_end_date) <= new Date();

      if (user.subscription_status !== "active" || subscriptionExpired) {
        return res
          .status(403)
          .json({ message: "Your account is suspended or has expired." });
      }
    }

    req.userId = user.id;
    req.userRole = user.role;
    return next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const adminOnly = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    if (req.userRole === "admin") {
      return next();
    }

    const { rows } = await query(
      "SELECT role FROM users WHERE id = $1",
      [req.userId]
    );
    const user = rows[0];

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required." });
    }

    req.userRole = user.role;
    return next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { protect, adminOnly };
