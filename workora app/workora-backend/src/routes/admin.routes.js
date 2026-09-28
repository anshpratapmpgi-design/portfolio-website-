const express = require("express");
const { body } = require("express-validator");

const prisma = require("../lib/prisma");
const validate = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireRole("ADMIN"));

/* ---------------------------------- Users ---------------------------------- */

router.get("/users", async (req, res) => {
  const { q } = req.query;
  const users = await prisma.user.findMany({
    where: q ? { email: { contains: q, mode: "insensitive" } } : {},
    select: { id: true, email: true, role: true, isBlocked: true, emailVerified: true, createdAt: true, lastLoginAt: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json({ users });
});

router.patch("/users/:id/block", [body("blocked").isBoolean()], validate, async (req, res) => {
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { isBlocked: req.body.blocked } });
  res.json({ user });
});

/* -------------------------------- Employers -------------------------------- */

router.get("/employers", async (req, res) => {
  const employers = await prisma.employer.findMany({ include: { company: true, user: { select: { email: true } } } });
  res.json({ employers });
});

router.patch("/employers/:id/verify", [body("verified").isBoolean()], validate, async (req, res) => {
  const employer = await prisma.employer.update({ where: { id: req.params.id }, data: { verified: req.body.verified } });
  res.json({ employer });
});

router.patch("/companies/:id/verify", [body("verified").isBoolean()], validate, async (req, res) => {
  const company = await prisma.company.update({ where: { id: req.params.id }, data: { verified: req.body.verified } });
  res.json({ company });
});

/* ----------------------------------- Jobs ----------------------------------- */

router.get("/jobs", async (req, res) => {
  const { status } = req.query;
  const jobs = await prisma.job.findMany({
    where: status ? { status } : {},
    include: { company: true, employer: { include: { user: { select: { email: true } } } } },
    orderBy: { postedAt: "desc" },
    take: 100,
  });
  res.json({ jobs });
});

router.patch("/jobs/:id/approve", async (req, res) => {
  const job = await prisma.job.update({ where: { id: req.params.id }, data: { status: "APPROVED" } });
  res.json({ job });
});

router.patch("/jobs/:id/reject", async (req, res) => {
  const job = await prisma.job.update({ where: { id: req.params.id }, data: { status: "REJECTED" } });
  res.json({ job });
});

router.delete("/jobs/:id", async (req, res) => {
  await prisma.job.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

/* ---------------------------------- Reports ---------------------------------- */

router.get("/reports", async (req, res) => {
  const reports = await prisma.report.findMany({
    where: req.query.status ? { status: req.query.status } : {},
    include: { reporter: { select: { email: true } }, job: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ reports });
});

router.patch(
  "/reports/:id",
  [body("status").isIn(["OPEN", "REVIEWED", "DISMISSED", "ACTION_TAKEN"])],
  validate,
  async (req, res) => {
    const report = await prisma.report.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    res.json({ report });
  }
);

/* --------------------------------- Analytics --------------------------------- */

router.get("/analytics", async (req, res) => {
  const [
    totalUsers, totalJobSeekers, totalEmployers, totalCompanies,
    totalJobs, activeJobs, totalApplications, openReports, newUsersThisWeek,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "JOB_SEEKER" } }),
    prisma.user.count({ where: { role: "EMPLOYER" } }),
    prisma.company.count(),
    prisma.job.count(),
    prisma.job.count({ where: { status: "APPROVED" } }),
    prisma.application.count(),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
  ]);

  const jobsByCategory = await prisma.job.groupBy({ by: ["categoryId"], _count: true });
  const jobsByCity = await prisma.job.groupBy({ by: ["city"], _count: true });

  res.json({
    totalUsers, totalJobSeekers, totalEmployers, totalCompanies,
    totalJobs, activeJobs, totalApplications, openReports, newUsersThisWeek,
    jobsByCategory, jobsByCity,
  });
});

module.exports = router;
