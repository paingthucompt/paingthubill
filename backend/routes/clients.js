const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { query } = require("../db");

const router = express.Router();

/**
 * GET /api/clients
 * Return all clients for the authenticated user.
 */
router.get("/", protect, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT *
         FROM clients
        WHERE user_id = $1
        ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Failed to load clients:", error);
    // If table is missing, return empty list so frontend doesn't show generic Server Error
    if (error && error.code === '42P01') {
      return res.json([]);
    }
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * POST /api/clients
 * Insert a new client belonging to the authenticated user.
 */
router.post("/", protect, async (req, res) => {
  const {
    name,
    phone = null,
    commission_percentage,
    preferred_payout_currency = "THB",
    bank_account = null,
    platform_details = null,
  } = req.body;

  try {
    if (!name || typeof commission_percentage === "undefined") {
      return res.status(400).json({ message: "Name and commission percentage are required." });
    }

    const commissionValue = Number.isFinite(commission_percentage)
      ? commission_percentage
      : parseFloat(commission_percentage);

    if (!Number.isFinite(commissionValue)) {
      return res.status(400).json({ message: "commission_percentage must be a valid number." });
    }

    const { rows } = await query(
      `INSERT INTO clients (
         user_id,
         name,
         phone,
         commission_percentage,
         preferred_payout_currency,
         bank_account,
         platform_details
       )
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
       RETURNING *`,
      [
        req.userId,
        name,
        phone,
        commissionValue,
        preferred_payout_currency,
        bank_account == null ? null : JSON.stringify(bank_account),
        platform_details == null ? null : JSON.stringify(platform_details),
      ]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Failed to create client:", error);
    if (error && error.code === '42P01') {
      return res.status(500).json({ message: "Database not initialized: clients table missing. Run migrations." });
    }
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * PUT /api/clients/:id
 * Update a client, ensuring it belongs to the authenticated user.
 */
router.put("/:id", protect, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    phone = null,
    commission_percentage,
    preferred_payout_currency = "THB",
    bank_account = null,
    platform_details = null,
  } = req.body;

  try {
    const commissionValue = Number.isFinite(commission_percentage)
      ? commission_percentage
      : parseFloat(commission_percentage);

    const { rows } = await query(
      `UPDATE clients
          SET name = $1,
              phone = $2,
              commission_percentage = $3,
              preferred_payout_currency = $4,
              bank_account = $5::jsonb,
              platform_details = $6::jsonb
        WHERE id = $7
          AND user_id = $8
        RETURNING *`,
      [
        name,
        phone,
        Number.isFinite(commissionValue) ? commissionValue : 0,
        preferred_payout_currency,
        bank_account == null ? null : JSON.stringify(bank_account),
        platform_details == null ? null : JSON.stringify(platform_details),
        id,
        req.userId,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Client not found or user not authorized." });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Failed to update client:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * DELETE /api/clients/:id
 * Remove a client that belongs to the authenticated user.
 */
router.delete("/:id", protect, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      "DELETE FROM clients WHERE id = $1 AND user_id = $2",
      [id, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Client not found or user not authorized." });
    }

    res.json({ message: "Client removed" });
  } catch (error) {
    console.error("Failed to delete client:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
