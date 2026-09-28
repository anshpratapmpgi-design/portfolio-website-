# WORKORA — Backend

A real REST API and database for the WORKORA job marketplace: auth (email/password
+ Google Identity Services), job postings, applications, candidate search,
nearby-jobs geolocation, notifications, job alerts, admin moderation.

This is a genuine, runnable backend — not mock data. Data persists in a real
database and survives logout, refresh, and new devices, which was the main gap
in the earlier click-through prototype.

## What's fully implemented

- **Auth**: signup/login with bcrypt-hashed passwords, Google ID token
  verification (backend-verified `sub`, never trusts the client), JWT access
  tokens (15 min) + rotating httpOnly refresh-token cookies (persistent
  sessions across browser restarts), forgot/reset password, logout, role
  checks (`JOB_SEEKER` / `EMPLOYER` / `ADMIN`) on every protected route.
- **Database**: full schema (Prisma) for every entity you listed — users,
  profiles, companies, jobs, applications, saved jobs, shortlists,
  notifications, resumes, skills, categories, alerts, reports.
- **Jobs**: search/filter (title, skill, company, city, category, salary,
  experience, job type, work mode, date posted), nearby-jobs via Haversine
  distance, employer CRUD with an approval workflow, basic duplicate
  detection.
- **Applications**: apply, prevent double-applying, status pipeline (Applied →
  Under Review → Shortlisted → Interview → Selected/Rejected), notifications
  on submit and on status change.
- **Employer tools**: company profile, dashboard counts, my jobs, candidate
  search (respects profile visibility), shortlist.
- **Admin**: user/employer/company/job moderation, approve/reject jobs,
  reports queue, analytics counts.
- **Resumes**: secure upload (PDF/DOC/DOCX, 5MB limit, random filename on
  disk), owner-only download/delete, one primary resume.
- **Job alerts**: create/list/delete, plus a `matchNewJobToAlerts()` function
  ready to be called when a job is approved (wire it to a cron job or call it
  directly in the admin "approve" route).

## What you still need to configure or build

These require accounts/keys only you can create, or are genuinely separate
projects:

1. **Google OAuth Client ID** — create one at
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   add it to `.env`, and use Google Identity Services on the frontend to get
   an ID token, which you POST to `/api/auth/google`.
2. **Reverse geocoding** — `src/lib/geocode.js` is a working stub; plug in a
   provider key (Google Geocoding, OpenCage, Mapbox) to turn lat/lng into a
   city name. Without it, users just type their city manually — nothing
   breaks.
3. **Email delivery** — password reset currently logs the reset link to the
   server console. Wire a provider (SendGrid, Postmark, SES) in
   `auth.routes.js` where marked.
4. **Frontend** — this backend is framework-agnostic. The React prototype UI
   built earlier in this conversation can be wired to these endpoints (swap
   its in-memory `useState` for `fetch`/`axios` calls). I can do that wiring,
   plus build the Employer dashboard and Admin panel UI, as a next step.
5. **Third-party job API integration** — no legitimate authorized job feed is
   connected (that requires a real licensing agreement with a provider). The
   architecture supports it cleanly: fetch from provider → normalize →
   `prisma.job.create()` with `source` field → same search/serve pipeline.
6. **Hosting** — run this locally for development, or deploy to
   Render/Railway/Fly.io with a managed Postgres add-on for production. This
   chat can't host a live server for you.

## Setup

```bash
cd workora-backend
npm install
cp .env.example .env          # then fill in JWT secrets + Google client ID
npx prisma migrate dev --name init
npm run seed                  # creates job categories + a demo admin login
npm run dev                   # http://localhost:4000
```

Demo admin login (change immediately): `admin@workora.app` / `ChangeMe123!`

## Switching to Postgres for production

In `prisma/schema.prisma`, change:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
and set `DATABASE_URL` to your Postgres connection string. Re-run
`npx prisma migrate dev`. No other code changes needed — all queries go
through Prisma.

## Security notes

- Passwords are hashed with bcrypt (12 rounds), never stored or logged in
  plain text. Google sign-in never sees or stores a password at all.
- Refresh tokens are opaque, stored server-side, and rotated on every use —
  a stolen token can be revoked, unlike a stateless JWT.
- Rate limiting on auth endpoints (20 attempts / 15 min) plus a global API
  limiter.
- `helmet()` sets standard security headers; enable `secure: true` on the
  refresh cookie (already conditional on `NODE_ENV=production`) once you're
  behind HTTPS.
- Resume files are stored with randomized names, outside any public/static
  directory, and only served through an authenticated, ownership-checked
  route.
