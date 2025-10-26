const express = require("express");
const bcrypt = require("bcryptjs");
const { query } = require("../db");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

router.post("/users", async (req, res) => {
  const { email, password, role = 'user', subscription_days = 30 } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  if (role !== 'user' && role !== 'admin') {
    return res
      .status(400)
      .json({ message: "Role must be either 'user' or 'admin'." });
  }

  const duration = Number(subscription_days);
  if (Number.isNaN(duration) || duration <= 0) {
    return res
      .status(400)
      .json({ message: "subscription_days must be a positive number." });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await query(
      `
        INSERT INTO users (email, password_hash, role, subscription_status, subscription_end_date)
        VALUES ($1, $2, $3, 'active', now() + ($4 || ' days')::interval)
        RETURNING id, email, role, subscription_status, subscription_end_date
      `,
      [email, passwordHash, role, duration]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Email already exists." });
    }
    console.error("Create user error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.put("/users/:id/suspend", async (req, res) => {
  const { id } = req.params;

  try {
    const { rowCount } = await query(
      `
        UPDATE users
        SET subscription_status = 'suspended'
        WHERE id = $1
      `,
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ message: "User suspended." });
  } catch (error) {
    console.error("Suspend user error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.put("/users/:id/reactivate", async (req, res) => {
  const { id } = req.params;
  const { subscription_days = 30 } = req.body;

  const duration = Number(subscription_days);
  if (Number.isNaN(duration) || duration <= 0) {
    return res
      .status(400)
      .json({ message: "subscription_days must be a positive number." });
  }

  try {
    const { rowCount } = await query(
      `
        UPDATE users
        SET subscription_status = 'active',
            subscription_end_date = now() + ($2 || ' days')::interval
        WHERE id = $1
      `,
      [id, duration]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ message: "User reactivated." });
  } catch (error) {
    console.error("Reactivate user error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.get("/users", async (_req, res) => {
  try {
    const { rows } = await query(
      `
        SELECT id, email, role, subscription_status, subscription_end_date, created_at
        FROM users
        ORDER BY created_at DESC
      `
    );
    return res.json(rows);
  } catch (error) {
    console.error("List users error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// GET /api/admin/payments - return recent payment/transaction summaries
router.get("/payments", async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT t.id,
              t.payout_amount,
              t.payout_currency,
              t.transaction_date,
              t.source_platform,
              u.id AS user_id,
              u.email AS user_email,
              c.id AS client_id,
              c.name AS client_name
         FROM transactions t
         LEFT JOIN users u ON u.id = t.user_id
         LEFT JOIN clients c ON c.id = t.client_id
        ORDER BY t.transaction_date DESC
        LIMIT 50`
    );

    // If table doesn't exist return empty array gracefully
    if (!rows) return res.json([]);

    const mapped = rows.map((r) => ({
      id: r.id,
      amount: r.payout_amount == null ? null : Number(r.payout_amount),
      currency: r.payout_currency,
      status: 'completed', // All existing transactions are completed
      payment_date: r.transaction_date,
      source_platform: r.source_platform,
      user: { id: r.user_id, email: r.user_email },
      client: { id: r.client_id, name: r.client_name },
    }));

    return res.json(mapped);
  } catch (error) {
    console.error("Admin payments error:", error);
    if (error && error.code === '42P01') {
      return res.json([]);
    }
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
