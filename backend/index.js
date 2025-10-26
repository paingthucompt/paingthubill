require('dotenv').config();
const express = require("express");
const { pool } = require("./db");
const authRouter = require("./routes/auth");
const clientsRouter = require("./routes/clients");
const adminRouter = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/admin", adminRouter);
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/invoices', require('./routes/invoices'));

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Database health check failed:", error);
    res.status(500).json({ status: "error", message: "DB unreachable" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
