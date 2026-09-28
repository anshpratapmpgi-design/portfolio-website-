import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Home, Search, FileText, Bookmark, User, ArrowLeft, MapPin, Briefcase,
  GraduationCap, Clock, CheckCircle2, SlidersHorizontal, X, ChevronRight,
  BadgeCheck, Send, Upload, LogOut, Pencil, Star, Building2, Circle,
  CheckCircle, XCircle, Mail, Phone, ChevronDown
} from "lucide-react";

/* ---------------------------------- DATA ---------------------------------- */

const CATEGORIES = [
  "Delivery", "Driver", "Sales", "IT & Software", "Customer Support",
  "Data Entry", "Warehouse", "Telecalling", "Field Executive", "Design",
];

const COMPANIES = [
  { name: "Nimbus Logistics", color: "#1E2F4F" },
  { name: "Vantra Retail", color: "#C98F26" },
  { name: "Aarohi Health", color: "#2E9E64" },
  { name: "Suvidha Foods", color: "#D65D5D" },
  { name: "Kridha Tech", color: "#5B6EAE" },
];

const JOBS = [
  {
    id: "j1", title: "Delivery Executive", company: "Nimbus Logistics", verified: true,
    color: "#1E2F4F", location: "Lucknow, UP", salaryMin: 15000, salaryMax: 22000,
    type: "Full-time", mode: "On-site", experience: "0-1 yrs", education: "10th Pass",
    skills: ["Two-wheeler", "Local area knowledge"], category: "Delivery", posted: "2 days ago",
    source: "WorkIndia", external: true, match: 95, applicants: 214, deadline: "22 Sep 2026",
    description: "Deliver packages across assigned zones in Lucknow with your own two-wheeler. Daily payouts available.",
    responsibilities: ["Pick up and deliver parcels on time", "Collect payment on delivery where applicable", "Maintain delivery records on the app"],
    requirements: ["Valid driving license", "Own two-wheeler", "Smartphone with data"],
    benefits: ["Daily payout option", "Fuel allowance", "Accident insurance"],
  },
  {
    id: "j2", title: "Frontend Developer", company: "Kridha Tech", verified: true,
    color: "#5B6EAE", location: "Bengaluru, KA", salaryMin: 600000, salaryMax: 900000,
    type: "Full-time", mode: "Hybrid", experience: "2-4 yrs", education: "B.Tech / BCA",
    skills: ["React", "TypeScript", "CSS"], category: "IT & Software", posted: "5 hours ago",
    source: "WORKORA", external: false, match: 88, applicants: 63, deadline: "30 Sep 2026",
    description: "Build and maintain customer-facing web products used by lakhs of users every day.",
    responsibilities: ["Ship UI features in React", "Collaborate with design on interaction details", "Write maintainable, tested components"],
    requirements: ["2+ years with React", "Strong CSS fundamentals", "Comfortable with Git workflows"],
    benefits: ["Health insurance", "Hybrid work", "Annual learning budget"],
  },
  {
    id: "j3", title: "Telecaller - Customer Support", company: "Vantra Retail", verified: true,
    color: "#C98F26", location: "Noida, UP", salaryMin: 16000, salaryMax: 20000,
    type: "Full-time", mode: "On-site", experience: "0-2 yrs", education: "12th Pass",
    skills: ["Hindi", "English", "Communication"], category: "Telecalling", posted: "1 day ago",
    source: "WorkIndia", external: true, match: 91, applicants: 142, deadline: "25 Sep 2026",
    description: "Handle inbound customer queries and resolve order issues over the phone for a growing retail brand.",
    responsibilities: ["Answer inbound calls", "Log complaints accurately", "Escalate unresolved issues"],
    requirements: ["Clear spoken Hindi and English", "Basic computer knowledge"],
    benefits: ["PF & ESI", "Incentives on performance"],
  },
  {
    id: "j4", title: "Warehouse Associate", company: "Suvidha Foods", verified: false,
    color: "#D65D5D", location: "Pune, MH", salaryMin: 14000, salaryMax: 17000,
    type: "Full-time", mode: "On-site", experience: "0-1 yrs", education: "10th Pass",
    skills: ["Physical fitness", "Inventory basics"], category: "Warehouse", posted: "3 days ago",
    source: "WorkIndia", external: true, match: 76, applicants: 98, deadline: "20 Sep 2026",
    description: "Sort, pack and load goods at our regional fulfilment center on rotating shifts.",
    responsibilities: ["Sort incoming stock", "Pack outgoing orders", "Maintain inventory counts"],
    requirements: ["Able to lift up to 20kg", "Willing to work rotating shifts"],
    benefits: ["Overtime pay", "Shift meals"],
  },
  {
    id: "j5", title: "Data Entry Operator", company: "Aarohi Health", verified: true,
    color: "#2E9E64", location: "Remote", salaryMin: 18000, salaryMax: 24000,
    type: "Part-time", mode: "Remote", experience: "0-2 yrs", education: "Graduate",
    skills: ["MS Excel", "Typing speed 35+ wpm"], category: "Data Entry", posted: "6 hours ago",
    source: "WORKORA", external: false, match: 84, applicants: 51, deadline: "28 Sep 2026",
    description: "Digitise patient records and maintain clean, accurate data sheets for our clinics network.",
    responsibilities: ["Enter patient data into internal systems", "Cross-check records for accuracy", "Flag discrepancies to the ops team"],
    requirements: ["Comfortable with Excel/Sheets", "Attention to detail"],
    benefits: ["Fully remote", "Flexible hours"],
  },
  {
    id: "j6", title: "Field Sales Executive", company: "Vantra Retail", verified: true,
    color: "#C98F26", location: "Kanpur, UP", salaryMin: 17000, salaryMax: 25000,
    type: "Full-time", mode: "On-site", experience: "1-3 yrs", education: "12th Pass",
    skills: ["Field sales", "Negotiation"], category: "Sales", posted: "4 days ago",
    source: "WorkIndia", external: true, match: 80, applicants: 176, deadline: "26 Sep 2026",
    description: "Visit local retailers to onboard them onto our distribution network and grow territory sales.",
    responsibilities: ["Visit assigned retail outlets daily", "Onboard new retail partners", "Track daily sales against targets"],
    requirements: ["Own two-wheeler preferred", "Willingness to travel locally"],
    benefits: ["Travel allowance", "Monthly incentives"],
  },
  {
    id: "j7", title: "UI/UX Design Intern", company: "Kridha Tech", verified: true,
    color: "#5B6EAE", location: "Remote", salaryMin: 10000, salaryMax: 12000,
    type: "Internship", mode: "Remote", experience: "Fresher", education: "Design student",
    skills: ["Figma", "Prototyping"], category: "Design", posted: "1 day ago",
    source: "WORKORA", external: false, match: 72, applicants: 39, deadline: "24 Sep 2026",
    description: "Support the product design team in wireframing and prototyping new app features.",
    responsibilities: ["Create wireframes and mockups", "Assist in usability sessions", "Maintain the design system"],
    requirements: ["Portfolio of design work", "Familiarity with Figma"],
    benefits: ["Certificate", "Stipend", "Mentorship"],
  },
  {
    id: "j8", title: "Customer Support Executive", company: "Nimbus Logistics", verified: true,
    color: "#1E2F4F", location: "Lucknow, UP", salaryMin: 16000, salaryMax: 21000,
    type: "Full-time", mode: "Hybrid", experience: "0-2 yrs", education: "Graduate",
    skills: ["Communication", "CRM tools"], category: "Customer Support", posted: "8 hours ago",
    source: "WORKORA", external: false, match: 89, applicants: 87, deadline: "29 Sep 2026",
    description: "Resolve delivery-related queries for customers via chat and phone in a hybrid role.",
    responsibilities: ["Respond to customer chats and calls", "Coordinate with delivery teams", "Track resolution turnaround time"],
    requirements: ["Good written and verbal communication", "Basic CRM familiarity"],
    benefits: ["Hybrid schedule", "Health insurance"],
  },
];

const STATUS_STEPS = ["Applied", "Under Review", "Shortlisted", "Interview", "Selected"];

const INITIAL_APPLICATIONS = [
  { id: "a1", jobId: "j3", status: "Shortlisted", appliedOn: "10 Sep 2026" },
  { id: "a2", jobId: "j6", status: "Under Review", appliedOn: "12 Sep 2026" },
];

const PROFILE = {
  name: "Ananya Verma",
  headline: "Customer Support Professional",
  location: "Lucknow, UP",
  email: "ananya.verma@email.com",
  phone: "+91 98xxxxxx21",
  about: "2 years of experience handling customer queries across phone and chat. Looking for full-time roles in Lucknow or remote support roles.",
  skills: ["Communication", "CRM Tools", "MS Excel", "Hindi", "English"],
  experience: [{ role: "Support Associate", org: "Suvidha Foods", period: "2024 - Present" }],
  education: [{ degree: "B.Com", school: "Lucknow University", period: "2021 - 2024" }],
  expectedSalary: "₹18,000 - ₹24,000 / month",
  preferredType: "Full-time",
  preferredMode: "Hybrid",
};

/* ------------------------------- HELPERS ------------------------------- */

function formatSalary(min, max) {
  const fmt = (n) => (n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${Math.round(n / 1000)}K`);
  return `${fmt(min)} - ${fmt(max)}`;
}

function jobById(id) {
  return JOBS.find((j) => j.id === id);
}

/* ------------------------------- ATOMS ------------------------------- */

function MatchBadge({ value }) {
  if (!value) return null;
  const tone = value >= 90 ? "var(--green)" : value >= 80 ? "var(--gold-dark)" : "var(--mist)";
  return (
    <div className="match-badge" style={{ color: tone, borderColor: tone }}>
      <Star size={11} fill={tone} stroke="none" />
      {value}% Match
    </div>
  );
}

function CompanyMark({ name, color, size = 40 }) {
  const initial = name.trim().charAt(0);
  return (
    <div className="company-mark" style={{ background: color, width: size, height: size, fontSize: size * 0.42 }}>
      {initial}
    </div>
  );
}

function SourceTag({ source }) {
  return <span className={`source-tag ${source === "WORKORA" ? "src-native" : "src-partner"}`}>Source: {source}</span>;
}

/* ------------------------------- JOB CARD ------------------------------- */

function JobCard({ job, saved, onToggleSave, onOpen, animIndex = 0 }) {
  return (
    <div className="job-card" style={{ animationDelay: `${animIndex * 40}ms` }} onClick={() => onOpen(job.id)}>
      <div className="job-card-rail" style={{ background: job.color }} />
      <div className="job-card-body">
        <div className="job-card-top">
          <CompanyMark name={job.company} color={job.color} />
          <div className="job-card-titles">
            <div className="job-title-row">
              <h3>{job.title}</h3>
            </div>
            <div className="job-company-row">
              <span>{job.company}</span>
              {job.verified && <BadgeCheck size={14} color="var(--green)" />}
            </div>
          </div>
          <button
            className="icon-btn save-btn"
            onClick={(e) => { e.stopPropagation(); onToggleSave(job.id); }}
            aria-label="Save job"
          >
            <Bookmark size={18} fill={saved ? "var(--gold)" : "none"} color={saved ? "var(--gold)" : "var(--mist)"} />
          </button>
        </div>

        <div className="job-meta-row">
          <span className="job-meta"><MapPin size={13} /> {job.location}</span>
          <span className="job-meta">₹ {formatSalary(job.salaryMin, job.salaryMax)}</span>
        </div>
        <div className="job-meta-row">
          <span className="job-meta"><Briefcase size={13} /> {job.type}</span>
          <span className="job-meta"><Clock size={13} /> {job.posted}</span>
        </div>

        <div className="job-card-bottom">
          <MatchBadge value={job.match} />
          <SourceTag source={job.source} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- TOP BAR ------------------------------- */

function TopBar({ title, onBack, right }) {
  return (
    <div className="top-bar">
      {onBack ? (
        <button className="icon-btn" onClick={onBack}><ArrowLeft size={20} /></button>
      ) : <div style={{ width: 36 }} />}
      <h2>{title}</h2>
      <div style={{ width: 36, display: "flex", justifyContent: "flex-end" }}>{right}</div>
    </div>
  );
}

/* ------------------------------- HOME SCREEN ------------------------------- */

function HomeScreen({ saved, onToggleSave, onOpenJob, onGoSearch, onSelectCategory }) {
  const recommended = JOBS.filter((j) => j.match).sort((a, b) => b.match - a.match).slice(0, 4);
  return (
    <div className="screen-scroll">
      <div className="home-hero">
        <p className="hero-eyebrow">Good afternoon, Ananya</p>
        <h1>Find work. Build your future.</h1>
        <button className="search-fake" onClick={onGoSearch}>
          <Search size={16} color="var(--mist)" />
          <span>Job title, skill or company</span>
        </button>
      </div>

      <section className="home-section">
        <h4>Popular categories</h4>
        <div className="chip-scroll">
          {CATEGORIES.map((c) => (
            <button key={c} className="chip" onClick={() => onSelectCategory(c)}>{c}</button>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="section-head">
          <h4>Recommended for you</h4>
          <button className="link-btn" onClick={onGoSearch}>See all <ChevronRight size={14} /></button>
        </div>
        <div className="stacked-cards">
          {recommended.map((j, i) => (
            <JobCard key={j.id} job={j} saved={saved.has(j.id)} onToggleSave={onToggleSave} onOpen={onOpenJob} animIndex={i} />
          ))}
        </div>
      </section>

      <section className="home-section">
        <h4>Top companies hiring</h4>
        <div className="chip-scroll">
          {COMPANIES.map((c) => (
            <div key={c.name} className="company-chip">
              <CompanyMark name={c.name} color={c.color} size={32} />
              <span>{c.name}</span>
            </div>
          ))}
        </div>
      </section>
      <div style={{ height: 12 }} />
    </div>
  );
}

/* ------------------------------- FILTER SHEET ------------------------------- */

function FilterSheet({ open, filters, setFilters, onClose, onApply }) {
  const types = ["Full-time", "Part-time", "Internship", "Freelance"];
  const modes = ["On-site", "Hybrid", "Remote"];

  const toggle = (key, value) => {
    setFilters((f) => {
      const set = new Set(f[key]);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...f, [key]: set };
    });
  };

  return (
    <div className={`sheet-overlay ${open ? "open" : ""}`} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h3>Filters</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <p className="filter-label">Job type</p>
        <div className="filter-row">
          {types.map((t) => (
            <button key={t} className={`filter-pill ${filters.type.has(t) ? "active" : ""}`} onClick={() => toggle("type", t)}>{t}</button>
          ))}
        </div>

        <p className="filter-label">Work mode</p>
        <div className="filter-row">
          {modes.map((m) => (
            <button key={m} className={`filter-pill ${filters.mode.has(m) ? "active" : ""}`} onClick={() => toggle("mode", m)}>{m}</button>
          ))}
        </div>

        <button className="btn-primary full" onClick={onApply}>Show results</button>
      </div>
    </div>
  );
}

/* ------------------------------- SEARCH SCREEN ------------------------------- */

function SearchScreen({ saved, onToggleSave, onOpenJob, initialCategory }) {
  const [query, setQuery] = useState(initialCategory || "");
  const [filters, setFilters] = useState({ type: new Set(), mode: new Set() });
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => { setQuery(initialCategory || ""); }, [initialCategory]);

  const results = useMemo(() => {
    return JOBS.filter((j) => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q ||
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.category.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q);
      const matchesType = filters.type.size === 0 || filters.type.has(j.type);
      const matchesMode = filters.mode.size === 0 || filters.mode.has(j.mode);
      return matchesQuery && matchesType && matchesMode;
    });
  }, [query, filters]);

  const activeFilterCount = filters.type.size + filters.mode.size;

  return (
    <div className="screen-flex">
      <div className="search-bar-row">
        <div className="search-input">
          <Search size={16} color="var(--mist)" />
          <input placeholder="Job title, skill or company" value={query} onChange={(e) => setQuery(e.target.value)} />
          {query && <button className="icon-btn tiny" onClick={() => setQuery("")}><X size={14} /></button>}
        </div>
        <button className="filter-fab" onClick={() => setSheetOpen(true)}>
          <SlidersHorizontal size={17} />
          {activeFilterCount > 0 && <span className="filter-dot">{activeFilterCount}</span>}
        </button>
      </div>

      <p className="result-count">{results.length} jobs found</p>

      <div className="screen-scroll no-top-pad">
        <div className="stacked-cards">
          {results.map((j, i) => (
            <JobCard key={j.id} job={j} saved={saved.has(j.id)} onToggleSave={onToggleSave} onOpen={onOpenJob} animIndex={i} />
          ))}
          {results.length === 0 && (
            <div className="empty-state">
              <Search size={28} color="var(--mist)" />
              <p>No jobs match your search.</p>
              <span>Try a different title, skill or location.</span>
            </div>
          )}
        </div>
      </div>

      <FilterSheet
        open={sheetOpen}
        filters={filters}
        setFilters={setFilters}
        onClose={() => setSheetOpen(false)}
        onApply={() => setSheetOpen(false)}
      />
    </div>
  );
}

/* ------------------------------- JOB DETAIL SCREEN ------------------------------- */

function JobDetailScreen({ jobId, saved, onToggleSave, onBack, onApply, alreadyApplied }) {
  const job = jobById(jobId);
  if (!job) return null;
  return (
    <div className="overlay-screen">
      <TopBar
        title="Job details"
        onBack={onBack}
        right={
          <button className="icon-btn" onClick={() => onToggleSave(job.id)}>
            <Bookmark size={19} fill={saved ? "var(--gold)" : "none"} color={saved ? "var(--gold)" : "var(--ink)"} />
          </button>
        }
      />
      <div className="screen-scroll">
        <div className="detail-header">
          <CompanyMark name={job.company} color={job.color} size={52} />
          <h1>{job.title}</h1>
          <div className="detail-company-row">
            <span>{job.company}</span>
            {job.verified ? (
              <span className="verified-pill"><BadgeCheck size={13} /> Verified Company</span>
            ) : (
              <span className="unverified-pill">Unverified</span>
            )}
          </div>
          <MatchBadge value={job.match} />
        </div>

        <div className="detail-stat-grid">
          <div className="stat"><MapPin size={15} /><span>{job.location}</span></div>
          <div className="stat"><span className="rupee">₹</span><span>{formatSalary(job.salaryMin, job.salaryMax)}</span></div>
          <div className="stat"><Briefcase size={15} /><span>{job.type} · {job.mode}</span></div>
          <div className="stat"><GraduationCap size={15} /><span>{job.experience} · {job.education}</span></div>
        </div>

        <div className="detail-section">
          <h4>About the role</h4>
          <p>{job.description}</p>
        </div>

        <div className="detail-section">
          <h4>Responsibilities</h4>
          <ul>{job.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul>
        </div>

        <div className="detail-section">
          <h4>Requirements</h4>
          <ul>{job.requirements.map((r) => <li key={r}>{r}</li>)}</ul>
        </div>

        <div className="detail-section">
          <h4>Benefits</h4>
          <div className="chip-scroll no-scroll-wrap">
            {job.benefits.map((b) => <span key={b} className="chip static">{b}</span>)}
          </div>
        </div>

        <div className="detail-section">
          <h4>Skills</h4>
          <div className="chip-scroll no-scroll-wrap">
            {job.skills.map((s) => <span key={s} className="chip static">{s}</span>)}
          </div>
        </div>

        <div className="detail-footer-meta">
          <span>{job.applicants} applicants</span>
          <span>Apply by {job.deadline}</span>
        </div>
        <SourceTag source={job.source} />
        <div style={{ height: 90 }} />
      </div>

      <div className="detail-cta-bar">
        {alreadyApplied ? (
          <button className="btn-primary full disabled" disabled>
            <CheckCircle2 size={16} /> Application submitted
          </button>
        ) : job.external ? (
          <button className="btn-primary full" onClick={() => onApply(job.id)}>Apply on {job.source}</button>
        ) : (
          <button className="btn-primary full" onClick={() => onApply(job.id)}>Apply now</button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- APPLY SCREEN ------------------------------- */

function ApplyScreen({ jobId, onBack, onSubmitted }) {
  const job = jobById(jobId);
  const [resumeAttached, setResumeAttached] = useState(true);
  const [coverLetter, setCoverLetter] = useState("");
  const [stage, setStage] = useState("form"); // form -> submitting -> done

  const submit = () => {
    setStage("submitting");
    setTimeout(() => setStage("done"), 900);
    setTimeout(() => onSubmitted(jobId), 1900);
  };

  if (!job) return null;

  return (
    <div className="overlay-screen">
      <TopBar title="Apply" onBack={stage === "form" ? onBack : undefined} />
      {stage !== "done" ? (
        <div className="screen-scroll">
          <div className="apply-job-summary">
            <CompanyMark name={job.company} color={job.color} size={40} />
            <div>
              <h4>{job.title}</h4>
              <span>{job.company} · {job.location}</span>
            </div>
          </div>

          <div className="detail-section">
            <h4>Resume</h4>
            <div className={`resume-box ${resumeAttached ? "attached" : ""}`} onClick={() => setResumeAttached(true)}>
              <Upload size={16} />
              <span>{resumeAttached ? "Ananya_Verma_Resume.pdf" : "Tap to upload resume"}</span>
              {resumeAttached && <CheckCircle2 size={16} color="var(--green)" />}
            </div>
          </div>

          <div className="detail-section">
            <h4>Cover letter <span className="optional">(optional)</span></h4>
            <textarea
              rows={5}
              placeholder={`Tell ${job.company} why you're a good fit...`}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </div>
          <div style={{ height: 90 }} />
        </div>
      ) : (
        <div className="success-screen">
          <div className="success-check"><CheckCircle2 size={56} color="var(--green)" /></div>
          <h2>Application sent</h2>
          <p>Your application for {job.title} at {job.company} has been submitted. Track its progress from Applications.</p>
        </div>
      )}

      {stage === "form" && (
        <div className="detail-cta-bar">
          <button className="btn-primary full" onClick={submit} disabled={!resumeAttached}>
            <Send size={15} /> Submit application
          </button>
        </div>
      )}
      {stage === "submitting" && (
        <div className="detail-cta-bar">
          <button className="btn-primary full disabled" disabled>Submitting...</button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- APPLICATIONS SCREEN ------------------------------- */

function statusIndex(status) { return STATUS_STEPS.indexOf(status); }

function ApplicationTrackerCard({ app }) {
  const job = jobById(app.jobId);
  if (!job) return null;
  const rejected = app.status === "Rejected";
  const currentIdx = rejected ? -1 : statusIndex(app.status);

  return (
    <div className="tracker-card">
      <div className="tracker-top">
        <CompanyMark name={job.company} color={job.color} size={36} />
        <div className="tracker-titles">
          <h4>{job.title}</h4>
          <span>{job.company} · Applied {app.appliedOn}</span>
        </div>
      </div>

      {rejected ? (
        <div className="rejected-row"><XCircle size={15} color="var(--coral)" /> Not selected this time</div>
      ) : (
        <div className="stepper">
          {STATUS_STEPS.map((s, i) => (
            <div key={s} className="stepper-item">
              <div className={`stepper-dot ${i <= currentIdx ? "done" : ""} ${i === currentIdx ? "current" : ""}`}>
                {i < currentIdx ? <CheckCircle size={12} color="white" /> : null}
              </div>
              <span className={i <= currentIdx ? "done-label" : ""}>{s}</span>
              {i < STATUS_STEPS.length - 1 && <div className={`stepper-line ${i < currentIdx ? "done" : ""}`} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationsScreen({ applications, onOpenJob }) {
  return (
    <div className="screen-scroll">
      <div className="section-title-block">
        <h1>Applications</h1>
        <p>{applications.length} active applications</p>
      </div>
      <div className="stacked-cards">
        {applications.length === 0 && (
          <div className="empty-state">
            <FileText size={28} color="var(--mist)" />
            <p>No applications yet.</p>
            <span>Jobs you apply to will show up here.</span>
          </div>
        )}
        {[...applications].reverse().map((a, i) => (
          <div key={a.id} onClick={() => onOpenJob(a.jobId)} style={{ animationDelay: `${i * 40}ms` }} className="tracker-wrap">
            <ApplicationTrackerCard app={a} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- SAVED SCREEN ------------------------------- */

function SavedScreen({ saved, onToggleSave, onOpenJob }) {
  const savedJobs = JOBS.filter((j) => saved.has(j.id));
  return (
    <div className="screen-scroll">
      <div className="section-title-block">
        <h1>Saved jobs</h1>
        <p>{savedJobs.length} jobs saved</p>
      </div>
      <div className="stacked-cards">
        {savedJobs.length === 0 && (
          <div className="empty-state">
            <Bookmark size={28} color="var(--mist)" />
            <p>Nothing saved yet.</p>
            <span>Tap the bookmark icon on a job to save it here.</span>
          </div>
        )}
        {savedJobs.map((j, i) => (
          <JobCard key={j.id} job={j} saved onToggleSave={onToggleSave} onOpen={onOpenJob} animIndex={i} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- PROFILE SCREEN ------------------------------- */

function ProfileScreen() {
  const [editing, setEditing] = useState(false);
  return (
    <div className="screen-scroll">
      <div className="profile-header">
        <div className="avatar">{PROFILE.name.charAt(0)}</div>
        <h1>{PROFILE.name}</h1>
        <p>{PROFILE.headline}</p>
        <span className="profile-location"><MapPin size={13} /> {PROFILE.location}</span>
        <button className="edit-toggle" onClick={() => setEditing((e) => !e)}>
          <Pencil size={13} /> {editing ? "Done editing" : "Edit profile"}
        </button>
      </div>

      <div className="detail-section">
        <h4>Contact</h4>
        <div className="contact-row"><Mail size={14} /><span>{PROFILE.email}</span></div>
        <div className="contact-row"><Phone size={14} /><span>{PROFILE.phone}</span></div>
      </div>

      <div className="detail-section">
        <h4>About</h4>
        {editing ? <textarea defaultValue={PROFILE.about} rows={4} /> : <p>{PROFILE.about}</p>}
      </div>

      <div className="detail-section">
        <h4>Skills</h4>
        <div className="chip-scroll no-scroll-wrap">
          {PROFILE.skills.map((s) => <span key={s} className="chip static">{s}</span>)}
        </div>
      </div>

      <div className="detail-section">
        <h4>Experience</h4>
        {PROFILE.experience.map((e) => (
          <div key={e.role} className="exp-row">
            <div className="exp-dot" />
            <div><strong>{e.role}</strong><span>{e.org} · {e.period}</span></div>
          </div>
        ))}
      </div>

      <div className="detail-section">
        <h4>Education</h4>
        {PROFILE.education.map((e) => (
          <div key={e.degree} className="exp-row">
            <div className="exp-dot" />
            <div><strong>{e.degree}</strong><span>{e.school} · {e.period}</span></div>
          </div>
        ))}
      </div>

      <div className="detail-section">
        <h4>Preferences</h4>
        <div className="detail-stat-grid two-col">
          <div className="stat"><span className="rupee">₹</span><span>{PROFILE.expectedSalary}</span></div>
          <div className="stat"><Briefcase size={15} /><span>{PROFILE.preferredType}</span></div>
          <div className="stat"><Building2 size={15} /><span>{PROFILE.preferredMode}</span></div>
        </div>
      </div>

      <button className="btn-secondary full logout-btn"><LogOut size={15} /> Log out</button>
      <div style={{ height: 12 }} />
    </div>
  );
}

/* ------------------------------- BOTTOM NAV ------------------------------- */

function BottomNav({ active, onChange, appCount, savedCount }) {
  const tabs = [
    { key: "home", label: "Home", icon: Home },
    { key: "search", label: "Search", icon: Search },
    { key: "applications", label: "Applications", icon: FileText, badge: appCount },
    { key: "saved", label: "Saved", icon: Bookmark, badge: savedCount },
    { key: "profile", label: "Profile", icon: User },
  ];
  return (
    <div className="bottom-nav">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.key;
        return (
          <button key={t.key} className={`nav-item ${isActive ? "active" : ""}`} onClick={() => onChange(t.key)}>
            <div className="nav-icon-wrap">
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
              {!!t.badge && <span className="nav-badge">{t.badge}</span>}
            </div>
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------- ROOT APP ------------------------------- */

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [overlay, setOverlay] = useState(null); // {type:'detail'|'apply', jobId}
  const [overlayMounted, setOverlayMounted] = useState(false);
  const [saved, setSaved] = useState(new Set());
  const [applications, setApplications] = useState(INITIAL_APPLICATIONS);
  const [searchCategory, setSearchCategory] = useState("");

  useEffect(() => {
    if (overlay) {
      const id = requestAnimationFrame(() => setOverlayMounted(true));
      return () => cancelAnimationFrame(id);
    } else {
      setOverlayMounted(false);
    }
  }, [overlay?.type, overlay?.jobId]);

  const closeOverlay = () => {
    setOverlayMounted(false);
    setTimeout(() => setOverlay(null), 260);
  };

  const toggleSave = (jobId) => {
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(jobId) ? next.delete(jobId) : next.add(jobId);
      return next;
    });
  };

  const hasApplied = (jobId) => applications.some((a) => a.jobId === jobId);

  const openDetail = (jobId) => setOverlay({ type: "detail", jobId });
  const openApply = (jobId) => setOverlay({ type: "apply", jobId });

  const submitApplication = (jobId) => {
    setApplications((prev) => [
      ...prev,
      { id: `a${Date.now()}`, jobId, status: "Applied", appliedOn: "Today" },
    ]);
    closeOverlay();
  };

  const goSearch = (category = "") => {
    setSearchCategory(category);
    setActiveTab("search");
  };

  return (
    <div className="workora-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

        :root {
          --ink:#10192B; --indigo:#1E2F4F; --indigo-light:#2C4372;
          --gold:#E3A83B; --gold-dark:#C98F26; --paper:#F6F4EF; --paper-dim:#ECE8DF;
          --mist:#8A93A6; --line:#E1DCD1; --green:#2E9E64; --coral:#D65D5D; --white:#FFFFFF;
        }
        * { box-sizing: border-box; }
        .workora-root { font-family:'Inter',sans-serif; color:var(--ink); display:flex; justify-content:center; background:#DCD7CC; padding:24px 0; min-height:640px; }

        .phone-frame { width:390px; max-width:100%; height:800px; background:var(--paper); border-radius:36px; box-shadow:0 30px 60px rgba(16,25,43,0.25); overflow:hidden; position:relative; display:flex; flex-direction:column; border:8px solid var(--ink); }
        .status-bar { height:28px; display:flex; align-items:center; justify-content:space-between; padding:0 22px; font-size:12px; font-weight:600; color:var(--ink); background:var(--paper); flex-shrink:0; }

        .tab-content { flex:1; position:relative; overflow:hidden; display:flex; flex-direction:column; }
        .screen-scroll { flex:1; overflow-y:auto; padding:18px 18px 12px; }
        .screen-scroll.no-top-pad { padding-top:0; }
        .screen-flex { flex:1; display:flex; flex-direction:column; overflow:hidden; }

        h1,h2,h3,h4 { font-family:'Sora',sans-serif; margin:0; color:var(--ink); }

        /* Home */
        .home-hero { padding:6px 2px 18px; }
        .hero-eyebrow { margin:0 0 6px; font-size:13px; color:var(--mist); font-weight:500; }
        .home-hero h1 { font-size:26px; line-height:1.25; font-weight:700; margin-bottom:16px; }
        .search-fake { width:100%; display:flex; align-items:center; gap:8px; background:var(--white); border:1px solid var(--line); border-radius:14px; padding:13px 14px; color:var(--mist); font-size:14px; font-family:'Inter',sans-serif; cursor:pointer; }

        .home-section { margin-bottom:22px; }
        .home-section h4 { font-size:15px; margin-bottom:12px; font-weight:600; }
        .section-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
        .link-btn { display:flex; align-items:center; gap:2px; background:none; border:none; color:var(--gold-dark); font-size:12.5px; font-weight:600; cursor:pointer; font-family:'Inter',sans-serif; }

        .chip-scroll { display:flex; gap:9px; overflow-x:auto; padding-bottom:4px; scrollbar-width:none; }
        .chip-scroll::-webkit-scrollbar{ display:none; }
        .chip-scroll.no-scroll-wrap { flex-wrap:wrap; overflow:visible; }
        .chip { flex-shrink:0; background:var(--white); border:1px solid var(--line); padding:8px 14px; border-radius:20px; font-size:13px; font-weight:500; color:var(--indigo); cursor:pointer; font-family:'Inter',sans-serif; }
        .chip.static { cursor:default; background:var(--paper-dim); }
        .company-chip { flex-shrink:0; display:flex; flex-direction:column; align-items:center; gap:6px; width:68px; }
        .company-chip span { font-size:10.5px; text-align:center; color:var(--indigo); line-height:1.2; }

        /* Cards */
        .stacked-cards { display:flex; flex-direction:column; gap:12px; }
        .job-card { display:flex; background:var(--white); border-radius:16px; overflow:hidden; border:1px solid var(--line); cursor:pointer; animation:cardIn 0.35s ease backwards; }
        @keyframes cardIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .job-card-rail { width:4px; flex-shrink:0; }
        .job-card-body { flex:1; padding:13px 14px; }
        .job-card-top { display:flex; align-items:flex-start; gap:10px; }
        .company-mark { border-radius:11px; color:white; font-family:'Sora',sans-serif; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .job-card-titles { flex:1; min-width:0; }
        .job-title-row h3 { font-size:15px; font-weight:600; }
        .job-company-row { display:flex; align-items:center; gap:4px; margin-top:2px; font-size:12.5px; color:var(--mist); }
        .save-btn { margin-top:-2px; }
        .job-meta-row { display:flex; gap:16px; margin-top:9px; }
        .job-meta { display:flex; align-items:center; gap:4px; font-size:12px; color:var(--indigo); font-weight:500; }
        .job-card-bottom { display:flex; align-items:center; justify-content:space-between; margin-top:11px; }
        .match-badge { display:flex; align-items:center; gap:3px; font-size:11px; font-weight:700; border:1px solid; border-radius:8px; padding:3px 7px; }
        .source-tag { font-size:10.5px; font-weight:600; padding:3px 7px; border-radius:8px; }
        .src-native { background:rgba(46,158,100,0.12); color:var(--green); }
        .src-partner { background:rgba(138,147,166,0.15); color:var(--mist); }

        .icon-btn { background:none; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:10px; color:var(--ink); }
        .icon-btn:active { background:var(--paper-dim); }
        .icon-btn.tiny { width:22px; height:22px; }

        /* Search */
        .search-bar-row { display:flex; gap:10px; padding:14px 18px 8px; align-items:center; }
        .search-input { flex:1; display:flex; align-items:center; gap:8px; background:var(--white); border:1px solid var(--line); border-radius:12px; padding:10px 12px; }
        .search-input input { border:none; outline:none; flex:1; font-size:14px; font-family:'Inter',sans-serif; background:transparent; }
        .filter-fab { position:relative; width:42px; height:42px; border-radius:12px; background:var(--ink); color:white; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
        .filter-dot { position:absolute; top:-4px; right:-4px; background:var(--gold); color:var(--ink); font-size:10px; font-weight:700; width:16px; height:16px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
        .result-count { padding:0 18px; font-size:12.5px; color:var(--mist); margin:2px 0 10px; }

        /* Filter sheet */
        .sheet-overlay { position:absolute; inset:0; background:rgba(16,25,43,0); pointer-events:none; transition:background 0.25s ease; z-index:20; display:flex; align-items:flex-end; }
        .sheet-overlay.open { background:rgba(16,25,43,0.45); pointer-events:auto; }
        .sheet { width:100%; background:var(--paper); border-radius:22px 22px 0 0; padding:10px 20px 22px; transform:translateY(100%); transition:transform 0.28s cubic-bezier(.22,.9,.36,1); }
        .sheet-overlay.open .sheet { transform:translateY(0); }
        .sheet-handle { width:36px; height:4px; background:var(--line); border-radius:3px; margin:6px auto 14px; }
        .sheet-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
        .filter-label { font-size:12.5px; font-weight:600; color:var(--mist); margin:14px 0 8px; }
        .filter-row { display:flex; gap:8px; flex-wrap:wrap; }
        .filter-pill { border:1px solid var(--line); background:var(--white); padding:8px 13px; border-radius:20px; font-size:13px; cursor:pointer; font-family:'Inter',sans-serif; color:var(--indigo); }
        .filter-pill.active { background:var(--ink); border-color:var(--ink); color:white; }

        .btn-primary { background:var(--gold); color:var(--ink); border:none; border-radius:13px; padding:14px; font-weight:700; font-size:14.5px; font-family:'Sora',sans-serif; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; transition:transform 0.15s ease; }
        .btn-primary:active { transform:scale(0.98); }
        .btn-primary.full { width:100%; }
        .btn-primary.disabled, .btn-primary:disabled { opacity:0.5; cursor:default; }
        .btn-secondary { background:transparent; border:1.5px solid var(--line); color:var(--ink); border-radius:13px; padding:13px; font-weight:600; font-size:14px; font-family:'Inter',sans-serif; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; }
        .btn-secondary.full { width:100%; }

        .empty-state { display:flex; flex-direction:column; align-items:center; text-align:center; padding:48px 20px; color:var(--mist); gap:6px; }
        .empty-state p { font-weight:600; color:var(--ink); margin:6px 0 0; font-family:'Sora',sans-serif; }
        .empty-state span { font-size:12.5px; }

        /* Overlay screens (detail / apply) */
        .overlay-screen { position:absolute; inset:0; background:var(--paper); display:flex; flex-direction:column; z-index:30; }
        .top-bar { display:flex; align-items:center; justify-content:space-between; padding:12px 12px; flex-shrink:0; background:var(--paper); border-bottom:1px solid var(--line); }
        .top-bar h2 { font-size:15.5px; }

        .detail-header { text-align:center; padding:14px 6px 18px; display:flex; flex-direction:column; align-items:center; gap:6px; }
        .detail-header h1 { font-size:20px; margin-top:8px; }
        .detail-company-row { display:flex; align-items:center; gap:6px; font-size:13px; color:var(--mist); font-weight:500; }
        .verified-pill { display:flex; align-items:center; gap:3px; color:var(--green); font-weight:600; font-size:12px; }
        .unverified-pill { color:var(--coral); font-weight:600; font-size:12px; }

        .detail-stat-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:6px; }
        .detail-stat-grid.two-col { grid-template-columns:1fr 1fr; }
        .stat { display:flex; align-items:center; gap:7px; background:var(--white); border:1px solid var(--line); border-radius:12px; padding:10px 11px; font-size:12.5px; font-weight:600; color:var(--indigo); }
        .rupee { font-family:'Sora',sans-serif; font-weight:700; }

        .detail-section { margin:20px 0; }
        .detail-section h4 { font-size:14.5px; margin-bottom:8px; }
        .detail-section p { font-size:13.5px; line-height:1.6; color:#3E4657; margin:0; }
        .detail-section ul { margin:0; padding-left:18px; display:flex; flex-direction:column; gap:6px; }
        .detail-section li { font-size:13.5px; line-height:1.5; color:#3E4657; }
        .optional { font-weight:400; color:var(--mist); font-size:12px; }

        .detail-footer-meta { display:flex; justify-content:space-between; font-size:12px; color:var(--mist); margin-bottom:10px; }
        .detail-cta-bar { padding:14px 18px; border-top:1px solid var(--line); background:var(--paper); flex-shrink:0; }

        /* Apply screen */
        .apply-job-summary { display:flex; align-items:center; gap:12px; background:var(--white); border:1px solid var(--line); border-radius:14px; padding:12px; margin-bottom:6px; }
        .apply-job-summary h4 { font-size:14px; }
        .apply-job-summary span { font-size:12px; color:var(--mist); }
        .resume-box { display:flex; align-items:center; gap:10px; border:1.5px dashed var(--line); border-radius:12px; padding:14px; font-size:13px; color:var(--mist); cursor:pointer; }
        .resume-box.attached { border-style:solid; border-color:var(--green); color:var(--ink); background:rgba(46,158,100,0.06); }
        .resume-box span { flex:1; }
        textarea { width:100%; border:1px solid var(--line); border-radius:12px; padding:12px; font-family:'Inter',sans-serif; font-size:13.5px; resize:none; background:var(--white); }

        .success-screen { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:30px; gap:6px; }
        .success-check { animation:pop 0.4s cubic-bezier(.34,1.56,.64,1); margin-bottom:6px; }
        @keyframes pop { from { transform:scale(0.4); opacity:0; } to { transform:scale(1); opacity:1; } }
        .success-screen h2 { font-size:19px; }
        .success-screen p { font-size:13.5px; color:var(--mist); line-height:1.6; max-width:270px; }

        /* Applications / tracker */
        .section-title-block { margin-bottom:16px; }
        .section-title-block h1 { font-size:22px; margin-bottom:4px; }
        .section-title-block p { font-size:13px; color:var(--mist); margin:0; }
        .tracker-wrap { animation:cardIn 0.35s ease backwards; cursor:pointer; }
        .tracker-card { background:var(--white); border:1px solid var(--line); border-radius:16px; padding:14px; }
        .tracker-top { display:flex; gap:10px; align-items:center; margin-bottom:14px; }
        .tracker-titles h4 { font-size:14px; }
        .tracker-titles span { font-size:12px; color:var(--mist); }
        .stepper { display:flex; align-items:flex-start; }
        .stepper-item { flex:1; display:flex; flex-direction:column; align-items:center; position:relative; }
        .stepper-item span { font-size:9px; color:var(--mist); margin-top:6px; text-align:center; }
        .stepper-item span.done-label { color:var(--indigo); font-weight:600; }
        .stepper-dot { width:16px; height:16px; border-radius:50%; background:var(--paper-dim); border:2px solid var(--line); display:flex; align-items:center; justify-content:center; z-index:1; }
        .stepper-dot.done { background:var(--green); border-color:var(--green); }
        .stepper-dot.current { background:var(--gold); border-color:var(--gold); }
        .stepper-line { position:absolute; top:7px; left:50%; width:100%; height:2px; background:var(--line); z-index:0; }
        .stepper-line.done { background:var(--green); }
        .rejected-row { display:flex; align-items:center; gap:6px; font-size:12.5px; color:var(--coral); font-weight:600; }

        /* Profile */
        .profile-header { display:flex; flex-direction:column; align-items:center; text-align:center; padding:8px 0 20px; gap:4px; }
        .avatar { width:64px; height:64px; border-radius:50%; background:var(--indigo); color:white; font-family:'Sora',sans-serif; font-size:26px; font-weight:700; display:flex; align-items:center; justify-content:center; margin-bottom:6px; }
        .profile-header h1 { font-size:19px; }
        .profile-header p { font-size:13px; color:var(--mist); margin:0; }
        .profile-location { display:flex; align-items:center; gap:4px; font-size:12px; color:var(--mist); margin-top:2px; }
        .edit-toggle { margin-top:10px; display:flex; align-items:center; gap:5px; background:var(--white); border:1px solid var(--line); padding:7px 14px; border-radius:20px; font-size:12.5px; font-weight:600; color:var(--indigo); cursor:pointer; font-family:'Inter',sans-serif; }
        .contact-row { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--indigo); margin-bottom:6px; }
        .exp-row { display:flex; gap:10px; margin-bottom:12px; }
        .exp-dot { width:8px; height:8px; border-radius:50%; background:var(--gold); margin-top:5px; flex-shrink:0; }
        .exp-row strong { display:block; font-size:13.5px; font-weight:600; }
        .exp-row span { font-size:12px; color:var(--mist); }
        .logout-btn { color:var(--coral); border-color:rgba(214,93,93,0.35); margin-top:6px; }

        /* Bottom nav */
        .bottom-nav { display:flex; border-top:1px solid var(--line); background:var(--white); flex-shrink:0; padding:8px 4px 12px; }
        .nav-item { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; background:none; border:none; cursor:pointer; color:var(--mist); font-family:'Inter',sans-serif; padding:4px 0; }
        .nav-item span { font-size:9.5px; font-weight:600; }
        .nav-item.active { color:var(--ink); }
        .nav-icon-wrap { position:relative; }
        .nav-badge { position:absolute; top:-4px; right:-8px; background:var(--gold); color:var(--ink); font-size:9px; font-weight:700; min-width:14px; height:14px; border-radius:7px; display:flex; align-items:center; justify-content:center; padding:0 3px; }

        @media (max-width:420px) {
          .workora-root { padding:0; }
          .phone-frame { width:100%; height:100vh; border-radius:0; border:none; }
        }
      `}</style>

      <div className="phone-frame">
        <div className="status-bar">
          <span>9:41</span>
          <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, letterSpacing: 0.3 }}>WORKORA</span>
          <span>●●●●</span>
        </div>

        <div className="tab-content">
          {activeTab === "home" && (
            <HomeScreen
              saved={saved} onToggleSave={toggleSave} onOpenJob={openDetail}
              onGoSearch={() => goSearch("")} onSelectCategory={(c) => goSearch(c)}
            />
          )}
          {activeTab === "search" && (
            <SearchScreen saved={saved} onToggleSave={toggleSave} onOpenJob={openDetail} initialCategory={searchCategory} />
          )}
          {activeTab === "applications" && (
            <ApplicationsScreen applications={applications} onOpenJob={openDetail} />
          )}
          {activeTab === "saved" && (
            <SavedScreen saved={saved} onToggleSave={toggleSave} onOpenJob={openDetail} />
          )}
          {activeTab === "profile" && <ProfileScreen />}

          {overlay && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 30,
              transform: overlayMounted ? "translateX(0)" : "translateX(100%)",
              transition: "transform 0.28s cubic-bezier(.22,.9,.36,1)",
            }}>
              {overlay.type === "detail" && (
                <JobDetailScreen
                  jobId={overlay.jobId}
                  saved={saved.has(overlay.jobId)}
                  onToggleSave={toggleSave}
                  onBack={closeOverlay}
                  onApply={openApply}
                  alreadyApplied={hasApplied(overlay.jobId)}
                />
              )}
              {overlay.type === "apply" && (
                <ApplyScreen jobId={overlay.jobId} onBack={closeOverlay} onSubmitted={submitApplication} />
              )}
            </div>
          )}
        </div>

        <BottomNav active={activeTab} onChange={setActiveTab} appCount={applications.length} savedCount={saved.size} />
      </div>
    </div>
  );
}
