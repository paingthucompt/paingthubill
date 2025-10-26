const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { query } = require("../db");

const router = express.Router();

/**
 * GET /api/transactions
 */
router.get("/", protect, async (req, res) => {
  try {
    // Join with clients to filter by owner (clients.user_id) and return nested client info
    const { rows } = await query(
      `SELECT t.*, c.id AS client_id, c.name AS client_name, c.commission_percentage, c.preferred_payout_currency
         FROM transactions t
         JOIN clients c ON c.id = t.client_id
        WHERE c.user_id = $1
          AND t.user_id = $1
        ORDER BY t.transaction_date DESC`,
      [req.userId]
    );

    const mapped = rows.map((r) => ({
      id: r.id,
      client_id: r.client_id,
      incoming_amount_thb: r.incoming_amount_thb == null ? null : Number(r.incoming_amount_thb),
      original_amount_usd: r.original_amount_usd == null ? null : Number(r.original_amount_usd),
      fees: r.fees == null ? 0 : Number(r.fees),
      transaction_date: r.transaction_date,
      notes: r.notes,
      exchange_rate_mmk: r.exchange_rate_mmk == null ? 0 : Number(r.exchange_rate_mmk),
      payout_currency: r.payout_currency,
      payout_amount: r.payout_amount == null ? 0 : Number(r.payout_amount),
      source_platform: r.source_platform,
      source_platform_payout_id: r.source_platform_payout_id,
      payment_destination: (r.payment_destination && typeof r.payment_destination === 'string') ? JSON.parse(r.payment_destination) : r.payment_destination,
      clients: {
        id: r.client_id,
        name: r.client_name,
        commission_percentage: r.commission_percentage == null ? 0 : Number(r.commission_percentage),
        preferred_payout_currency: r.preferred_payout_currency,
      },
    }));

    res.json(mapped);
  } catch (error) {
    console.error("Failed to load transactions:", error);
    // If the transactions table doesn't exist (Postgres undefined_table 42P01),
    // return empty array to avoid generic server error in the frontend while DB is being provisioned.
    if (error && error.code === '42P01') {
      return res.json([]);
    }
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * POST /api/transactions
 */
router.post("/", protect, async (req, res) => {
  const {
    client_id,
    incoming_amount_thb,
    original_amount_usd,
    exchange_rate_mmk,
    payout_currency,
    payout_amount,
    transaction_date,
    source_platform,
    source_platform_payout_id,
    payment_destination,
    notes = null,
  } = req.body;

  // Basic validations to catch common edge-cases early
  if (!client_id) {
    return res.status(400).json({ message: "client_id is required." });
  }

  const numericFields = { incoming_amount_thb, original_amount_usd, exchange_rate_mmk, payout_amount };
  for (const [k, v] of Object.entries(numericFields)) {
    if (v != null && isNaN(Number(v))) {
      return res.status(400).json({ message: `${k} must be a valid number.` });
    }
    if (v != null && Number(v) < 0) {
      return res.status(400).json({ message: `${k} must be >= 0.` });
    }
  }

  if (payment_destination != null) {
    try {
      // ensure it's JSON-serializable
      JSON.stringify(payment_destination);
    } catch (e) {
      return res.status(400).json({ message: "payment_destination must be valid JSON/object." });
    }
  }
  try {
    const insertSql = `
      INSERT INTO transactions (
        user_id,
        client_id,
        incoming_amount_thb,
        original_amount_usd,
        fees,
        exchange_rate_mmk,
        payout_currency,
        payout_amount,
        transaction_date,
        source_platform,
        source_platform_payout_id,
        payment_destination,
        notes
      )
      SELECT
        $1,
        c.id,
        $3,
        $4,
        0,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11::jsonb,
        $12
      FROM clients c
      WHERE c.id = $2
        AND c.user_id = $1
      RETURNING *`;

    const { rows } = await query(insertSql, [
      req.userId,
      client_id,
      incoming_amount_thb,
      original_amount_usd,
      exchange_rate_mmk,
      payout_currency,
      payout_amount,
      transaction_date,
      source_platform,
      source_platform_payout_id,
      payment_destination == null ? null : JSON.stringify(payment_destination),
      notes,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Client not found or not owned by user." });
    }

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Failed to create transaction:", error);
    // If underlying table is missing, return clear guidance
    if (error && error.code === '42P01') {
      return res.status(500).json({ message: "Database not initialized: transactions table missing. Run migrations." });
    }
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * PUT /api/transactions/:id
 */
router.put("/:id", protect, async (req, res) => {
  const { id } = req.params;
  const {
    client_id,
    incoming_amount_thb,
    original_amount_usd,
    exchange_rate_mmk,
    payout_currency,
    payout_amount,
    transaction_date,
    source_platform,
    source_platform_payout_id,
    payment_destination,
    notes = null,
  } = req.body;

  try {
    const { rows } = await query(
      `UPDATE transactions
          SET client_id = $1,
              incoming_amount_thb = $2,
              original_amount_usd = $3,
              exchange_rate_mmk = $4,
              payout_currency = $5,
              payout_amount = $6,
              transaction_date = $7,
              source_platform = $8,
              source_platform_payout_id = $9,
              payment_destination = $10::jsonb,
              notes = $11
        WHERE id = $12
          AND user_id = $13
          AND EXISTS (
            SELECT 1 FROM clients c
            WHERE c.id = $1 AND c.user_id = $13
          )
        RETURNING *`,
      [
        client_id,
        incoming_amount_thb,
        original_amount_usd,
        exchange_rate_mmk,
        payout_currency,
        payout_amount,
        transaction_date,
        source_platform,
        source_platform_payout_id,
        payment_destination == null ? null : JSON.stringify(payment_destination),
        notes,
        id,
        req.userId,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Transaction not found or user not authorized." });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Failed to update transaction:", error);
    if (error && error.code === '42P01') {
      return res.status(500).json({ message: "Database not initialized: transactions table missing. Run migrations." });
    }
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * DELETE /api/transactions/:id
 */
router.delete("/:id", protect, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      "DELETE FROM transactions WHERE id = $1 AND user_id = $2",
      [id, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Transaction not found or user not authorized." });
    }

    res.json({ message: "Transaction removed" });
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
