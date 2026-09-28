const express = require("express");
const { body, query } = require("express-validator");

const prisma = require("../lib/prisma");
const validate = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireRole("EMPLOYER"));

/* -------------------------------- Company profile -------------------------------- */

router.get("/company", async (req, res) => {
  const employer = await prisma.employer.findUnique({ where: { userId: req.user.id }, include: { company: true } });
  res.json({ employer });
});

router.put(
  "/company",
  [body("name").notEmpty()],
  validate,
  async (req, res) => {
    const employer = await prisma.employer.findUnique({ where: { userId: req.user.id } });
    const { name, logoUrl, website, industry, description, size, city } = req.body;

    const company = employer.companyId
      ? await prisma.company.update({
          where: { id: employer.companyId },
          data: { name, logoUrl, website, industry, description, size, city },
        })
      : await prisma.company.create({ data: { name, logoUrl, website, industry, description, size, city } });

    if (!employer.companyId) {
      await prisma.employer.update({ where: { id: employer.id }, data: { companyId: company.id } });
    }

    res.json({ company });
  }
);

/* ---------------------------------- Dashboard ---------------------------------- */

router.get("/dashboard", async (req, res) => {
  const employer = await prisma.employer.findUnique({ where: { userId: req.user.id } });
  const jobIds = (await prisma.job.findMany({ where: { employerId: employer.id }, select: { id: true } })).map((j) => j.id);

  const [activeJobs, totalApplications, shortlisted, interviews, hired] = await Promise.all([
    prisma.job.count({ where: { employerId: employer.id, status: "APPROVED" } }),
    prisma.application.count({ where: { jobId: { in: jobIds } } }),
    prisma.application.count({ where: { jobId: { in: jobIds }, status: "SHORTLISTED" } }),
    prisma.application.count({ where: { jobId: { in: jobIds }, status: "INTERVIEW" } }),
    prisma.application.count({ where: { jobId: { in: jobIds }, status: "SELECTED" } }),
  ]);

  res.json({ activeJobs, totalApplications, shortlisted, interviews, hired });
});

router.get("/jobs", async (req, res) => {
  const employer = await prisma.employer.findUnique({ where: { userId: req.user.id } });
  const jobs = await prisma.job.findMany({
    where: { employerId: employer.id },
    include: { _count: { select: { applications: true } } },
    orderBy: { postedAt: "desc" },
  });
  res.json({ jobs });
});

/* -------------------------------- Candidate search -------------------------------- */
// Only PUBLIC-visibility profiles are searchable here — PRIVATE profiles can
// still be seen once a candidate applies directly to one of your jobs
// (see applications.routes.js), which is the "permission rules" boundary
// requested for resume/profile access.

router.get(
  "/candidates",
  [query("skill").optional(), query("city").optional(), query("experience").optional()],
  validate,
  async (req, res) => {
    const { skill, city, q } = req.query;

    const candidates = await prisma.jobSeekerProfile.findMany({
      where: {
        visibility: "PUBLIC",
        ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
        ...(skill ? { skills: { some: { skill: { name: { contains: skill, mode: "insensitive" } } } } } : {}),
        ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { headline: { contains: q, mode: "insensitive" } }] } : {}),
      },
      include: { skills: { include: { skill: true } }, experience: true, education: true },
      take: 40,
    });

    res.json({ candidates });
  }
);

router.post(
  "/shortlist",
  [body("jobId").notEmpty(), body("jobSeekerProfileId").notEmpty()],
  validate,
  async (req, res) => {
    const employer = await prisma.employer.findUnique({ where: { userId: req.user.id } });
    const { jobId, jobSeekerProfileId, note } = req.body;

    const shortlist = await prisma.candidateShortlist.upsert({
      where: { employerId_jobId_jobSeekerProfileId: { employerId: employer.id, jobId, jobSeekerProfileId } },
      update: { note },
      create: { employerId: employer.id, jobId, jobSeekerProfileId, note },
    });

    res.status(201).json({ shortlist });
  }
);

module.exports = router;
