const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");
const { OAuth2Client } = require("google-auth-library");

const prisma = require("../lib/prisma");
const validate = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const {
  signAccessToken,
  generateRefreshTokenValue,
  refreshTokenExpiry,
} = require("../lib/jwt");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Slow down credential-stuffing / brute-force attempts on login & signup.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in a few minutes." },
});

const REFRESH_COOKIE = "workora_refresh";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // requires HTTPS in prod
  sameSite: "lax",
  path: "/api/auth",
  maxAge: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30) * 24 * 60 * 60 * 1000,
};

// Creates the role-specific profile row alongside the User row, and issues
// both tokens. Shared by signup, login and Google sign-in so session behavior
// (what gets persisted, cookie shape, response shape) never drifts between them.
async function issueSession(res, user) {
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const accessToken = signAccessToken(user);
  const refreshToken = generateRefreshTokenValue();
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt: refreshTokenExpiry() },
  });

  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  return accessToken;
}

function publicUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

/* --------------------------- Email/password --------------------------- */

router.post(
  "/signup",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("role").isIn(["JOB_SEEKER", "EMPLOYER"]),
    body("name").trim().notEmpty(),
  ],
  validate,
  async (req, res) => {
    const { email, password, role, name } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "An account with this email already exists" });

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        preferences: { create: {} },
        ...(role === "JOB_SEEKER"
          ? { jobSeekerProfile: { create: { fullName: name } } }
          : { employer: { create: { fullName: name } } }),
      },
    });

    const accessToken = await issueSession(res, user);
    res.status(201).json({ user: publicUser(user), accessToken });
  }
);

router.post(
  "/login",
  authLimiter,
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  validate,
  async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Same error for "no such user" and "wrong password" — don't leak which one.
    if (!user || !user.passwordHash) return res.status(401).json({ error: "Incorrect email or password" });
    if (user.isBlocked) return res.status(403).json({ error: "This account has been suspended" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Incorrect email or password" });

    const accessToken = await issueSession(res, user);
    res.json({ user: publicUser(user), accessToken });
  }
);

/* ------------------------------- Google ------------------------------- */
// Frontend uses Google Identity Services to get an ID token from the user's
// browser (no password ever touches WORKORA). We verify that token here on
// the backend and use the token's `sub` claim as the permanent Google
// account identifier — never trust an ID sent directly from the client.

router.post(
  "/google",
  authLimiter,
  [body("idToken").notEmpty(), body("role").optional().isIn(["JOB_SEEKER", "EMPLOYER"])],
  validate,
  async (req, res) => {
    const { idToken, role } = req.body;

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      return res.status(401).json({ error: "Invalid Google credential" });
    }

    const { sub: googleId, email, name, picture, email_verified } = payload;

    let user = await prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      // Google account not linked yet — check if the email already has a
      // password-based account, and link Google to it rather than duplicating.
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        user = await prisma.user.update({ where: { id: user.id }, data: { googleId } });
      } else {
        const chosenRole = role || "JOB_SEEKER";
        user = await prisma.user.create({
          data: {
            email,
            googleId,
            role: chosenRole,
            emailVerified: !!email_verified,
            preferences: { create: {} },
            ...(chosenRole === "JOB_SEEKER"
              ? { jobSeekerProfile: { create: { fullName: name, photoUrl: picture } } }
              : { employer: { create: { fullName: name } } }),
          },
        });
      }
    }

    if (user.isBlocked) return res.status(403).json({ error: "This account has been suspended" });

    const accessToken = await issueSession(res, user);
    res.json({ user: publicUser(user), accessToken });
  }
);

/* --------------------------- Session lifecycle --------------------------- */

// Rotates the refresh token on every use (detects reuse of a stolen/expired
// token) and issues a fresh short-lived access token — this is what makes
// "stay logged in after closing the browser" work without storing passwords
// client-side.
router.post("/refresh", async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    return res.status(401).json({ error: "Session expired, please log in again" });
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user || user.isBlocked) return res.status(401).json({ error: "Not authenticated" });

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
  const accessToken = await issueSession(res, user);
  res.json({ user: publicUser(user), accessToken });
});

router.post("/logout", async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) await prisma.refreshToken.updateMany({ where: { token }, data: { revoked: true } });
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.json({ success: true });
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

/* ------------------------------ Forgot password ------------------------------ */
// NOTE: sending the actual email requires an email provider (SendGrid, SES,
// Postmark, etc). Wire the provider call where marked below — everything
// else (secure token generation, expiry, single-use enforcement) is real.

router.post(
  "/forgot-password",
  authLimiter,
  [body("email").isEmail().normalizeEmail()],
  validate,
  async (req, res) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success, whether or not the email exists — prevents
    // attackers from using this endpoint to discover registered emails.
    if (user && user.passwordHash) {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      });

      // TODO: send an email containing a link like
      // `${FRONTEND_URL}/reset-password?token=${token}`
      console.log(`[password reset] ${email} → token ${token} (valid 1 hour)`);
    }

    res.json({ message: "If an account exists for that email, a reset link has been sent." });
  }
);

router.post(
  "/reset-password",
  [body("token").notEmpty(), body("password").isLength({ min: 8 })],
  validate,
  async (req, res) => {
    const { token, password } = req.body;
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!record || record.used || record.expiresAt < new Date()) {
      return res.status(400).json({ error: "This reset link is invalid or has expired" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
      // Reset invalidates all existing sessions on other devices.
      prisma.refreshToken.updateMany({ where: { userId: record.userId }, data: { revoked: true } }),
    ]);

    res.json({ message: "Password updated. Please log in again." });
  }
);

module.exports = router;
