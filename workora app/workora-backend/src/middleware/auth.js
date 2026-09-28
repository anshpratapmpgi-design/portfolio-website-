const { verifyAccessToken } = require("../lib/jwt");
const prisma = require("../lib/prisma");

// Verifies the access token on every protected request. This is what makes a
// page "private": no valid token → 401, handled the same way for every route.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.isBlocked) return res.status(401).json({ error: "Not authenticated" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session expired, please log in again" });
  }
}

// Role-based authorization — e.g. requireRole("EMPLOYER"), requireRole("ADMIN")
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have permission to do that" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
