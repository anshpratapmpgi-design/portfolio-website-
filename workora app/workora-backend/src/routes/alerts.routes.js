const express = require("express");
const { body } = require("express-validator");

const prisma = require("../lib/prisma");
const validate = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { haversineKm } = require("../lib/distance");

const router = express.Router();
router.use(requireAuth, requireRole("JOB_SEEKER"));

router.get("/", async (req, res) => {
  const alerts = await prisma.jobAlert.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: "desc" } });
  res.json({ alerts });
});

router.post(
  "/",
  [body("title").optional(), body("category").optional(), body("city").optional()],
  validate,
  async (req, res) => {
    const { title, category, city, distanceKm, salaryMin, jobType } = req.body;
    const alert = await prisma.jobAlert.create({
      data: { userId: req.user.id, title, category, city, distanceKm, salaryMin, jobType },
    });
    res.status(201).json({ alert });
  }
);

router.delete("/:id", async (req, res) => {
  await prisma.jobAlert.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
  res.json({ success: true });
});

router.patch("/:id/toggle", [body("active").isBoolean()], validate, async (req, res) => {
  await prisma.jobAlert.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { active: req.body.active } });
  res.json({ success: true });
});

// Called by a scheduled job (e.g. node-cron, or a hosting provider's cron
// trigger) whenever a new job is approved — matches it against active alerts
// and creates a notification for each match. Wire it in src/index.js or a
// worker script; it's exported here so it's testable in isolation.
async function matchNewJobToAlerts(job) {
  const alerts = await prisma.jobAlert.findMany({ where: { active: true } });

  for (const alert of alerts) {
    const titleMatch = !alert.title || job.title.toLowerCase().includes(alert.title.toLowerCase());
    const cityMatch = !alert.city || job.city.toLowerCase().includes(alert.city.toLowerCase());
    const salaryMatch = !alert.salaryMin || (job.salaryMax ?? 0) >= alert.salaryMin;
    const typeMatch = !alert.jobType || job.jobType === alert.jobType;

    if (titleMatch && cityMatch && salaryMatch && typeMatch) {
      await prisma.notification.create({
        data: {
          userId: alert.userId,
          type: "JOB_ALERT_MATCH",
          title: "New matching job",
          message: `${job.title} in ${job.city} matches your alert.`,
        },
      });
    }
  }
}

module.exports = { router, matchNewJobToAlerts };
