const express = require("express");
const { body } = require("express-validator");

const prisma = require("../lib/prisma");
const validate = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

async function notify(userId, type, title, message) {
  await prisma.notification.create({ data: { userId, type, title, message } });
}

/* ------------------------------ Job seeker side ------------------------------ */

router.post(
  "/",
  requireAuth,
  requireRole("JOB_SEEKER"),
  [body("jobId").notEmpty()],
  validate,
  async (req, res) => {
    const { jobId, coverMessage, contactPhone, contactEmail, resumeId } = req.body;

    const job = await prisma.job.findUnique({ where: { id: jobId }, include: { employer: true } });
    if (!job || job.status !== "APPROVED") return res.status(404).json({ error: "Job not found" });

    const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId: req.user.id } });

    const existing = await prisma.application.findUnique({
      where: { jobId_jobSeekerProfileId: { jobId, jobSeekerProfileId: profile.id } },
    });
    if (existing) return res.status(409).json({ error: "You've already applied to this job" });

    const application = await prisma.application.create({
      data: {
        jobId,
        jobSeekerProfileId: profile.id,
        resumeId: resumeId || profile.primaryResumeId,
        coverMessage,
        contactPhone: contactPhone || req.user.phone,
        contactEmail: contactEmail || req.user.email,
      },
    });

    await notify(req.user.id, "APPLICATION_SUBMITTED", "Application submitted", `Your application for ${job.title} was sent.`);
    await notify(job.employer.userId, "NEW_APPLICATION", "New application", `A candidate applied to ${job.title}.`);

    res.status(201).json({ application });
  }
);

router.get("/mine", requireAuth, requireRole("JOB_SEEKER"), async (req, res) => {
  const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId: req.user.id } });
  const applications = await prisma.application.findMany({
    where: { jobSeekerProfileId: profile.id },
    include: { job: { include: { company: true } } },
    orderBy: { appliedAt: "desc" },
  });
  res.json({ applications });
});

/* --------------------------------- Saved jobs --------------------------------- */

router.post("/saved/:jobId", requireAuth, requireRole("JOB_SEEKER"), async (req, res) => {
  const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId: req.user.id } });
  const saved = await prisma.savedJob.upsert({
    where: { jobId_jobSeekerProfileId: { jobId: req.params.jobId, jobSeekerProfileId: profile.id } },
    update: {},
    create: { jobId: req.params.jobId, jobSeekerProfileId: profile.id },
  });
  res.status(201).json({ saved });
});

router.delete("/saved/:jobId", requireAuth, requireRole("JOB_SEEKER"), async (req, res) => {
  const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId: req.user.id } });
  await prisma.savedJob.deleteMany({ where: { jobId: req.params.jobId, jobSeekerProfileId: profile.id } });
  res.json({ success: true });
});

router.get("/saved", requireAuth, requireRole("JOB_SEEKER"), async (req, res) => {
  const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId: req.user.id } });
  const saved = await prisma.savedJob.findMany({
    where: { jobSeekerProfileId: profile.id },
    include: { job: { include: { company: true } } },
    orderBy: { savedAt: "desc" },
  });
  res.json({ saved });
});

/* -------------------------------- Employer side -------------------------------- */

router.get("/job/:jobId", requireAuth, requireRole("EMPLOYER"), async (req, res) => {
  const employer = await prisma.employer.findUnique({ where: { userId: req.user.id } });
  const job = await prisma.job.findUnique({ where: { id: req.params.jobId } });
  if (!job || job.employerId !== employer.id) return res.status(404).json({ error: "Job not found" });

  const applications = await prisma.application.findMany({
    where: { jobId: job.id },
    include: { profile: { include: { skills: { include: { skill: true } }, resumes: true } } },
    orderBy: { appliedAt: "desc" },
  });

  // Respect profile visibility: PRIVATE candidates only show up if they applied
  // directly (which they did, here) — full detail is always fine post-application.
  res.json({ applications });
});

router.patch(
  "/:id/status",
  requireAuth,
  requireRole("EMPLOYER"),
  [body("status").isIn(["APPLIED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "SELECTED", "REJECTED"])],
  validate,
  async (req, res) => {
    const employer = await prisma.employer.findUnique({ where: { userId: req.user.id } });
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { job: true, profile: true },
    });
    if (!application || application.job.employerId !== employer.id) {
      return res.status(404).json({ error: "Application not found" });
    }

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: { status: req.body.status },
    });

    const labels = {
      UNDER_REVIEW: "is now under review",
      SHORTLISTED: "You've been shortlisted",
      INTERVIEW: "An interview has been scheduled",
      SELECTED: "Congratulations — you've been selected",
      REJECTED: "was not selected this time",
    };
    if (labels[req.body.status]) {
      await notify(application.profile.userId, "APPLICATION_STATUS", "Application update", `${application.job.title}: ${labels[req.body.status]}.`);
    }

    res.json({ application: updated });
  }
);

module.exports = router;
