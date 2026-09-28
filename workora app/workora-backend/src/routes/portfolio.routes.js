const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.post("/queries", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const message = String(req.body.message || "").trim();

    if (!name || name.length > 80) {
      return res.status(400).json({ error: "Please enter a valid name." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
      return res.status(400).json({ error: "Please enter a valid email." });
    }

    if (!message || message.length > 2000) {
      return res.status(400).json({ error: "Please enter a query under 2000 characters." });
    }

    await prisma.portfolioQuery.create({
      data: { name, email, message },
    });

    return res.status(201).json({ message: "Query received." });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;