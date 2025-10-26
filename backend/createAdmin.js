require('dotenv').config();
const bcrypt = require("bcryptjs");
const { query, pool } = require("./db");

const EMAIL = "admin@example.com";
const PASSWORD = "admin123";
const ROLE = "admin";
const SUBSCRIPTION_STATUS = "active";
const SALT_ROUNDS = 12;

async function main() {
  try {
    const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 100);

    const insertSql = `
      INSERT INTO users (email, password_hash, role, subscription_status, subscription_expiry_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, role, subscription_status, subscription_expiry_date, created_at
    `;

    const { rows } = await query(insertSql, [
      EMAIL,
      passwordHash,
      ROLE,
      SUBSCRIPTION_STATUS,
      expiryDate,
    ]);

    console.log("Admin user created:");
    console.table(rows);
  } catch (error) {
    if (error.code === "23505") {
      console.error(`User with email ${EMAIL} already exists.`);
    } else {
      console.error("Failed to create admin user:", error);
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
