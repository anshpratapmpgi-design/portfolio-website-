const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_TTL || "15m" }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

// Refresh tokens are opaque random strings stored (hashed) in the DB so they
// can be revoked individually (logout, password reset, "log out all devices").
function generateRefreshTokenValue() {
  return crypto.randomBytes(48).toString("hex");
}

function refreshTokenExpiry() {
  const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateRefreshTokenValue,
  refreshTokenExpiry,
};
