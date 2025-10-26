// Centralized configuration for secrets and token expiry
module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || "koko_SaaS_app_secret_key_123!@#",
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || "koko_SaaS_refresh_key_456$%^",
  ACCESS_TOKEN_EXPIRY_ADMIN: process.env.ACCESS_TOKEN_EXPIRY_ADMIN || "24h",
  ACCESS_TOKEN_EXPIRY_USER: process.env.ACCESS_TOKEN_EXPIRY_USER || "1h",
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || "7d",
};
