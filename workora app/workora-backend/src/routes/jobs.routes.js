const express = require("express");
const { body, query } = require("express-validator");

const prisma = require("../lib/prisma");
const validate = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { haversineKm } = require("../lib/distance");

const router = express.Router();

function serializeJob(job, userLat, userLng) {
  const distanceKm =
    userLat != null && userLng != null && job.latitude != null && job.longitude != null
      ? Math.round(haversineKm(userLat, userLng, job.latitude, job.longitude) * 10) / 10
      : null;

  return {
    id: job.id,
    title: job.title,
    company: { id: job.company.id, name: job.company.name, logoUrl: job.company.logoUrl, verified: job.company.verified },
    category: job.category.name,
    city: job.city,
    area: job.area,
    distanceKm,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    jobType: job.jobType,
    workMode: job.workMode,
    experienceLevel: job.experienceLevel,
    educationRequired: job.educationRequired,
    vacancies: job.vacancies,
    skills: job.skills.map((s) => s.skill.name),
    description: job.description,
    responsibilities: job.responsibilities.split("\n").filter(Boolean),
    requirements: job.requirements.split("\n").filter(Boolean),
    benefits: job.benefits.split("\n").filter(Boolean),
    postedAt: job.postedAt,
    applicationDeadline: job.applicationDeadline,
    applicantCount: job._count?.applications ?? undefined,
  };
}

const JOB_INCLUDE = {
  company: true,
  category: true,
  skills: { include: { skill: true } },
  _count: { select: { applications: true } },
};

/* --------------------------------- Search --------------------------------- */
// Public endpoint — anonymous visitors can browse jobs; only applying requires login.

router.get(
  "/",
  [
    query("lat").optional().isFloat(),
    query("lng").optional().isFloat(),
    query("radiusKm").optional().isFloat({ min: 0 }),
    query("page").optional().isInt({ min: 1 }),
  ],
  validate,
  async (req, res) => {
    const {
      q, city, category, jobType, workMode, experienceLevel,
      salaryMin, salaryMax, datePosted, sort = "relevance",
      lat, lng, radiusKm, page = 1, pageSize = 20,
    } = req.query;

    const where = {
      status: "APPROVED",
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
      ...(jobType ? { jobType } : {}),
      ...(workMode ? { workMode } : {}),
      ...(experienceLevel ? { experienceLevel } : {}),
      ...(category ? { category: { name: { equals: category, mode: "insensitive" } } } : {}),
      ...(salaryMin ? { salaryMax: { gte: Number(salaryMin) } } : {}),
      ...(salaryMax ? { salaryMin: { lte: Number(salaryMax) } } : {}),
      ...(datePosted
        ? { postedAt: { gte: new Date(Date.now() - Number(datePosted) * 24 * 60 * 60 * 1000) } }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { company: { name: { contains: q, mode: "insensitive" } } },
              { skills: { some: { skill: { name: { contains: q, mode: "insensitive" } } } } },
            ],
          }
        : {}),
    };

    const orderBy =
      sort === "newest" ? { postedAt: "desc" } :
      sort === "salary" ? { salaryMax: "desc" } :
      { postedAt: "desc" }; // "relevance"/"nearest" are computed post-fetch below

    let jobs = await prisma.job.findMany({
      where,
      include: JOB_INCLUDE,
      orderBy,
      take: Number(pageSize) * 3, // over-fetch so we can filter by radius, then trim
      skip: (Number(page) - 1) * Number(pageSize),
    });

    let serialized = jobs.map((j) => serializeJob(j, lat ? Number(lat) : null, lng ? Number(lng) : null));

    if (lat && lng && radiusKm) {
      serialized = serialized.filter((j) => j.distanceKm !== null && j.distanceKm <= Number(radiusKm));
    }
    if (sort === "nearest" && lat && lng) {
      serialized.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }

    res.json({ jobs: serialized.slice(0, Number(pageSize)), page: Number(page) });
  }
);

router.get("/nearby", [query("lat").isFloat(), query("lng").isFloat()], validate, async (req, res) => {
  const { lat, lng, radiusKm = 10 } = req.query;
  const jobs = await prisma.job.findMany({ where: { status: "APPROVED" }, include: JOB_INCLUDE });

  const nearby = jobs
    .map((j) => serializeJob(j, Number(lat), Number(lng)))
    .filter((j) => j.distanceKm !== null && j.distanceKm <= Number(radiusKm))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  res.json({ jobs: nearby });
});

router.get("/:id", async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id }, include: JOB_INCLUDE });
  if (!job || job.status !== "APPROVED") return res.status(404).json({ error: "Job not found" });
  res.json({ job: serializeJob(job) });
});

/* ------------------------------- Employer CRUD ------------------------------- */

router.post(
  "/",
  requireAuth,
  requireRole("EMPLOYER"),
  [
    body("title").notEmpty(),
    body("description").notEmpty(),
    body("categoryName").notEmpty(),
    body("city").notEmpty(),
    body("jobType").isIn(["FULL_TIME", "PART_TIME", "INTERNSHIP", "FREELANCE"]),
    body("workMode").isIn(["ON_SITE", "HYBRID", "REMOTE"]),
  ],
  validate,
  async (req, res) => {
    const employer = await prisma.employer.findUnique({ where: { userId: req.user.id } });
    if (!employer?.companyId) {
      return res.status(400).json({ error: "Create your company profile before posting a job" });
    }

    const {
      title, description, responsibilities = [], requirements = [], benefits = [],
      city, area, latitude, longitude, salaryMin, salaryMax, jobType, workMode,
      experienceLevel = "Not specified", educationRequired = "Not specified",
      vacancies = 1, applicationDeadline, categoryName, skills = [],
    } = req.body;

    const category = await prisma.jobCategory.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });

    // Simple duplicate heuristic: same employer + title + city posted recently.
    const possibleDuplicate = await prisma.job.findFirst({
      where: {
        employerId: employer.id, title, city,
        postedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    const job = await prisma.job.create({
      data: {
        employerId: employer.id,
        companyId: employer.companyId,
        categoryId: category.id,
        title, description,
        responsibilities: responsibilities.join("\n"),
        requirements: requirements.join("\n"),
        benefits: benefits.join("\n"),
        city, area, latitude, longitude, salaryMin, salaryMax, jobType, workMode,
        experienceLevel, educationRequired, vacancies,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        status: "PENDING", // goes live only after admin approval
        isDuplicateFlag: !!possibleDuplicate,
        skills: {
          create: await Promise.all(
            skills.map(async (name) => {
              const skill = await prisma.skill.upsert({ where: { name }, update: {}, create: { name } });
              return { skillId: skill.id };
            })
          ),
        },
      },
      include: JOB_INCLUDE,
    });

    res.status(201).json({ job: serializeJob(job), message: "Submitted for review" });
  }
);

router.put("/:id", requireAuth, requireRole("EMPLOYER"), async (req, res) => {
  const employer = await prisma.employer.findUnique({ where: { userId: req.user.id } });
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job || job.employerId !== employer.id) return res.status(404).json({ error: "Job not found" });

  const allowed = [
    "title", "description", "city", "area", "salaryMin", "salaryMax",
    "jobType", "workMode", "experienceLevel", "educationRequired", "vacancies",
  ];
  const data = {};
  for (const key of allowed) if (key in req.body) data[key] = req.body[key];
  if ("responsibilities" in req.body) data.responsibilities = req.body.responsibilities.join("\n");
  if ("requirements" in req.body) data.requirements = req.body.requirements.join("\n");
  if ("benefits" in req.body) data.benefits = req.body.benefits.join("\n");

  // Edits go back to PENDING so admin re-reviews materially changed listings.
  data.status = "PENDING";

  const updated = await prisma.job.update({ where: { id: job.id }, data, include: JOB_INCLUDE });
  res.json({ job: serializeJob(updated) });
});

router.delete("/:id", requireAuth, requireRole("EMPLOYER"), async (req, res) => {
  const employer = await prisma.employer.findUnique({ where: { userId: req.user.id } });
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job || job.employerId !== employer.id) return res.status(404).json({ error: "Job not found" });

  await prisma.job.delete({ where: { id: job.id } });
  res.json({ success: true });
});

router.patch("/:id/close", requireAuth, requireRole("EMPLOYER"), async (req, res) => {
  const employer = await prisma.employer.findUnique({ where: { userId: req.user.id } });
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job || job.employerId !== employer.id) return res.status(404).json({ error: "Job not found" });

  const updated = await prisma.job.update({ where: { id: job.id }, data: { status: "CLOSED" } });
  res.json({ job: updated });
});

module.exports = router;
