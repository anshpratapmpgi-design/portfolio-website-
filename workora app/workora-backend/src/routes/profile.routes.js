const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { body } = require("express-validator");

const prisma = require("../lib/prisma");
const validate = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { reverseGeocode } = require("../lib/geocode");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "resumes");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    // Random filename on disk — never trust/reuse the user-supplied filename.
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).slice(0, 10);
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) return cb(new Error("Only PDF, DOC or DOCX files are allowed"));
    cb(null, true);
  },
});

async function getOwnProfile(userId) {
  return prisma.jobSeekerProfile.findUnique({
    where: { userId },
    include: {
      skills: { include: { skill: true } },
      experience: true,
      education: true,
      resumes: true,
    },
  });
}

function completionScore(profile) {
  const checks = [
    ["fullName", !!profile.fullName],
    ["email", true], // always present via User
    ["city", !!profile.city],
    ["skills", profile.skills.length > 0],
    ["experience", profile.experience.length > 0],
    ["education", profile.education.length > 0],
    ["resume", profile.resumes.length > 0],
    ["headline", !!profile.headline],
  ];
  const done = checks.filter(([, ok]) => ok);
  return {
    percent: Math.round((done.length / checks.length) * 100),
    complete: done.map(([k]) => k),
    missing: checks.filter(([, ok]) => !ok).map(([k]) => k),
  };
}

router.use(requireAuth, requireRole("JOB_SEEKER"));

router.get("/", async (req, res) => {
  const profile = await getOwnProfile(req.user.id);
  if (!profile) return res.status(404).json({ error: "Profile not found" });
  res.json({ profile, completion: completionScore(profile) });
});

router.put(
  "/",
  [
    body("fullName").optional().trim().notEmpty(),
    body("expectedSalaryMin").optional().isInt({ min: 0 }),
    body("expectedSalaryMax").optional().isInt({ min: 0 }),
    body("visibility").optional().isIn(["PUBLIC", "PRIVATE"]),
  ],
  validate,
  async (req, res) => {
    const allowed = [
      "fullName", "headline", "photoUrl", "about", "city", "area",
      "languages", "expectedSalaryMin", "expectedSalaryMax",
      "preferredJobType", "preferredWorkMode", "preferredLocation", "visibility",
    ];
    const data = {};
    for (const key of allowed) if (key in req.body) data[key] = req.body[key];

    const existing = await prisma.jobSeekerProfile.findUnique({ where: { userId: req.user.id } });
    const updated = await prisma.jobSeekerProfile.update({ where: { id: existing.id }, data });
    res.json({ profile: updated });
  }
);

/* --------------------------------- Skills --------------------------------- */

router.put("/skills", [body("skills").isArray()], validate, async (req, res) => {
  const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId: req.user.id } });
  const names = [...new Set(req.body.skills.map((s) => String(s).trim()).filter(Boolean))];

  await prisma.$transaction(async (tx) => {
    await tx.skillOnProfile.deleteMany({ where: { jobSeekerProfileId: profile.id } });
    for (const name of names) {
      const skill = await tx.skill.upsert({ where: { name }, update: {}, create: { name } });
      await tx.skillOnProfile.create({ data: { jobSeekerProfileId: profile.id, skillId: skill.id } });
    }
  });

  res.json({ skills: names });
});

/* ------------------------------- Experience -------------------------------- */

router.post(
  "/experience",
  [body("role").notEmpty(), body("company").notEmpty(), body("startDate").notEmpty()],
  validate,
  async (req, res) => {
    const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId: req.user.id } });
    const { role, company, startDate, endDate, current, description } = req.body;
    const exp = await prisma.experience.create({
      data: { jobSeekerProfileId: profile.id, role, company, startDate, endDate, current: !!current, description },
    });
    res.status(201).json({ experience: exp });
  }
);

router.delete("/experience/:id", async (req, res) => {
  const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId: req.user.id } });
  await prisma.experience.deleteMany({ where: { id: req.params.id, jobSeekerProfileId: profile.id } });
  res.json({ success: true });
});

/* -------------------------------- Education -------------------------------- */

router.post(
  "/education",
  [body("degree").notEmpty(), body("school").notEmpty()],
  validate,
  async (req, res) => {
    const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId: req.user.id } });
    const { degree, school, startYear, endYear } = req.body;
    const edu = await prisma.education.create({
      data: { jobSeekerProfileId: profile.id, degree, school, startYear, endYear },
    });
    res.status(201).json({ education: edu });
  }
);

router.delete("/education/:id", async (req, res) => {
  const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId: req.user.id } });
  await prisma.education.deleteMany({ where: { id: req.params.id, jobSeekerProfileId: profile.id } });
  res.json({ success: true });
});

/* --------------------------------- Resume --------------------------------- */

router.post("/resume", upload.single("resume"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId: req.user.id } });

  const resume = await prisma.resume.create({
    data: {
      jobSeekerProfileId: profile.id,
      fileName: req.file.originalname,
      storedPath: req.file.filename, // store only the generated name, not a full path
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      isPrimary: true,
    },
  });

  // Only one primary resume at a time.
  await prisma.resume.updateMany({
    where: { jobSeekerProfileId: profile.id, NOT: { id: resume.id } },
    data: { isPrimary: false },
  });
  await prisma.jobSeekerProfile.update({ where: { id: profile.id }, data: { primaryResumeId: resume.id } });

  res.status(201).json({ resume });
});

router.get("/resume/:id/download", async (req, res) => {
  const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId: req.user.id } });
  const resume = await prisma.resume.findFirst({ where: { id: req.params.id, jobSeekerProfileId: profile.id } });
  if (!resume) return res.status(404).json({ error: "Resume not found" });

  res.download(path.join(UPLOAD_DIR, resume.storedPath), resume.fileName);
});

router.delete("/resume/:id", async (req, res) => {
  const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId: req.user.id } });
  const resume = await prisma.resume.findFirst({ where: { id: req.params.id, jobSeekerProfileId: profile.id } });
  if (!resume) return res.status(404).json({ error: "Resume not found" });

  fs.unlink(path.join(UPLOAD_DIR, resume.storedPath), () => {});
  await prisma.resume.delete({ where: { id: resume.id } });
  res.json({ success: true });
});

/* -------------------------------- Location -------------------------------- */

router.post(
  "/location",
  [body("latitude").isFloat(), body("longitude").isFloat()],
  validate,
  async (req, res) => {
    const { latitude, longitude } = req.body;
    const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId: req.user.id } });

    const place = await reverseGeocode(latitude, longitude); // null if no API key configured

    const updated = await prisma.jobSeekerProfile.update({
      where: { id: profile.id },
      data: {
        latitude,
        longitude,
        ...(place?.city ? { city: place.city } : {}),
        ...(place?.area ? { area: place.area } : {}),
      },
    });
    await prisma.userPreference.update({ where: { userId: req.user.id }, data: { locationEnabled: true } });

    res.json({ profile: updated, geocoded: !!place });
  }
);

router.delete("/location", async (req, res) => {
  const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId: req.user.id } });
  await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data: { latitude: null, longitude: null },
  });
  await prisma.userPreference.update({ where: { userId: req.user.id }, data: { locationEnabled: false } });
  res.json({ success: true });
});

/* ------------------------------- Account/privacy ------------------------------- */

router.delete("/account", async (req, res) => {
  // Cascades remove profile, resumes, applications, saved jobs, etc. (see schema).
  await prisma.user.delete({ where: { id: req.user.id } });
  res.json({ success: true });
});

module.exports = router;
