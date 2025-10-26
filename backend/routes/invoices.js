const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { query } = require("../db");

const router = express.Router();

/**
 * GET /api/invoices
 */
router.get("/", protect, async (req, res) => {
  try {
    // Join invoices -> clients -> transactions to return nested clients and transactions
    const { rows } = await query(
      `SELECT i.*, c.id AS client_id, c.name AS client_name, c.phone AS client_phone, c.bank_account AS client_bank_account, c.commission_percentage, c.preferred_payout_currency, c.platform_details,
              t.incoming_amount_thb, t.original_amount_usd, t.fees, t.transaction_date, t.exchange_rate_mmk, t.payout_currency, t.payout_amount, t.source_platform, t.source_platform_payout_id, t.payment_destination
         FROM invoices i
         JOIN clients c ON c.id = i.client_id
         JOIN transactions t ON t.id = i.transaction_id
        WHERE c.user_id = $1
          AND i.user_id = $1
          AND t.user_id = $1
        ORDER BY i.created_at DESC`,
      [req.userId]
    );

    const mapped = rows.map((r) => ({
      id: r.id,
      invoice_number: r.invoice_number,
      transaction_id: r.transaction_id,
      total_amount: Number(r.total_amount),
      commission_amount: Number(r.commission_amount),
      net_amount: Number(r.net_amount),
      created_at: r.created_at,
      clients: {
        id: r.client_id,
        name: r.client_name,
        phone: r.client_phone,
        bank_account:
          r.client_bank_account && typeof r.client_bank_account === "string"
            ? JSON.parse(r.client_bank_account)
            : r.client_bank_account,
        commission_percentage: Number(r.commission_percentage),
        preferred_payout_currency: r.preferred_payout_currency,
        platform_details:
          r.platform_details && typeof r.platform_details === "string"
            ? JSON.parse(r.platform_details)
            : r.platform_details || null,
      },
      transactions: {
        incoming_amount_thb: r.incoming_amount_thb == null ? 0 : Number(r.incoming_amount_thb),
        original_amount_usd: r.original_amount_usd == null ? null : Number(r.original_amount_usd),
        fees: r.fees == null ? 0 : Number(r.fees),
        transaction_date: r.transaction_date,
        exchange_rate_mmk: r.exchange_rate_mmk == null ? 0 : Number(r.exchange_rate_mmk),
        payout_currency: r.payout_currency,
        payout_amount: r.payout_amount == null ? 0 : Number(r.payout_amount),
        source_platform: r.source_platform,
        source_platform_payout_id: r.source_platform_payout_id,
        payment_destination: (r.payment_destination && typeof r.payment_destination === 'string') ? JSON.parse(r.payment_destination) : r.payment_destination,
      },
    }));

    res.json(mapped);
  } catch (error) {
    console.error("Failed to load invoices:", error);
    if (error && error.code === '42P01') {
      return res.json([]);
    }
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * POST /api/invoices
 */
router.post("/", protect, async (req, res) => {
  const {
    transaction_id,
    total_amount,
    commission_amount,
    net_amount,
  } = req.body;

  try {
    const insertSql = `
      WITH permitted_transaction AS (
        SELECT t.client_id, t.id
        FROM transactions t
        WHERE t.id = $2
          AND t.user_id = $1
      )
      INSERT INTO invoices (
        user_id,
        client_id,
        transaction_id,
        total_amount,
        commission_amount,
        net_amount
      )
      SELECT
        $1,
        pt.client_id,
        pt.id,
        $3,
        $4,
        $5
      FROM permitted_transaction pt
      RETURNING *`;

    const { rows } = await query(insertSql, [
      req.userId,
      transaction_id,
      total_amount,
      commission_amount,
      net_amount,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Transaction not found or not owned by user." });
    }

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Failed to create invoice:", error);
    if (error && error.code === '42P01') {
      return res.status(500).json({ message: "Database not initialized: invoices table missing. Run migrations." });
    }
    if (error && error.code === '23505') {
      return res.status(409).json({ message: "Invoice already exists for this transaction." });
    }
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * DELETE /api/invoices/:id
 */
router.delete("/:id", protect, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      "DELETE FROM invoices WHERE id = $1 AND user_id = $2",
      [id, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Invoice not found or user not authorized." });
    }

    res.json({ message: "Invoice removed" });
  } catch (error) {
    console.error("Failed to delete invoice:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
