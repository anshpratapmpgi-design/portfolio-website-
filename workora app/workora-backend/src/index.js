require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const jobsRoutes = require("./routes/jobs.routes");
const applicationsRoutes = require("./routes/applications.routes");
const employerRoutes = require("./routes/employer.routes");
const adminRoutes = require("./routes/admin.routes");
const notificationsRoutes = require("./routes/notifications.routes");
const { router: alertsRoutes } = require("./routes/alerts.routes");
const reportsRoutes = require("./routes/reports.routes");
const portfolioRoutes = require("./routes/portfolio.routes");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true, // required so the refresh-token cookie is sent/received
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// A generous global limit as defense-in-depth; auth routes have their own
// stricter limiter (see auth.routes.js).
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/employer", employerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/portfolio", portfolioRoutes);

// Centralized error handler — covers thrown errors (e.g. multer file-type
// rejection) so they return clean JSON instead of leaking stack traces.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Something went wrong" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`WORKORA API listening on http://localhost:${PORT}`));
