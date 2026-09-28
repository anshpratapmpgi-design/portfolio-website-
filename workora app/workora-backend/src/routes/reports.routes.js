const express = require("express");
const { body } = require("express-validator");

const prisma = require("../lib/prisma");
const validate = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/",
  requireAuth,
  [
    body("targetType").isIn(["JOB", "USER", "EMPLOYER"]),
    body("targetId").notEmpty(),
    body("reason").trim().notEmpty(),
  ],
  validate,
  async (req, res) => {
    const { targetType, targetId, reason, jobId } = req.body;
    const report = await prisma.report.create({
      data: { reporterId: req.user.id, targetType, targetId, reason, jobId: jobId || (targetType === "JOB" ? targetId : null) },
    });
    res.status(201).json({ report, message: "Thanks — our team will review this." });
  }
);

module.exports = router;
