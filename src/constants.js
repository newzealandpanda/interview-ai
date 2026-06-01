// ── PALETTE ──────────────────────────────────────────────────────────────────
export const T    = "#45A29E";
export const TD   = "#2d7a76";
export const TL   = "#EAF7F6";
export const TM   = "#b8e8e5";
export const DARK = "#1F2937";
export const GREY = "#6B7280";
export const BG   = "#F9FBFB";

export const ROLES = [
  { id: "qa",       label: "QA Engineer",       icon: "/icon-qa.png" },
  { id: "frontend", label: "Frontend Developer", icon: "/icon-frontend.png" },
  { id: "backend",  label: "Backend Developer",  icon: "/icon-backend.png" },
  { id: "devops",   label: "DevOps / SRE",       icon: "/icon-devops.png" },
  { id: "pm",       label: "Product Manager",    icon: "/icon-pm.png" },
  { id: "data",     label: "Data Engineer / ML", icon: "/icon-ml.png" },
];

export const LEVELS = [
  { id: "junior", label: "Junior", desc: "0-2 years", icon: "/icon-junior.png" },
  { id: "middle", label: "Middle", desc: "2-5 years", icon: "/icon-middle.png" },
  { id: "senior", label: "Senior", desc: "5+ years",  icon: "/icon-senior.png" },
  { id: "expert", label: "Expert", desc: "10+ years", icon: "/icon-expert.png" },
];

export const MODES = [
  {
    id: "friendly", label: "Friendly", emoji: "😊",
    desc: "Supportive, encouraging atmosphere", color: "#22c55e",
    system: (role, level) => `You are Jamie, a warm and encouraging interviewer. You are interviewing a ${level} ${role} candidate.
YOUR PERSONALITY: Genuinely supportive and patient. When an answer is unclear, ask a gentle clarifying question. Create a conversational, low-pressure atmosphere.
INTERVIEW RULES: Ask ONE question at a time. React specifically to what was just said. Output the question only - no preamble.`,
  },
  {
    id: "normal", label: "Normal", emoji: "💼",
    desc: "Professional, realistic interview", color: "#45A29E",
    system: (role, level) => `You are Alex, a professional senior interviewer. You are interviewing a ${level} ${role} candidate.
YOUR STYLE: Neutral, professional tone. Evaluate both technical depth and communication clarity. If an answer is vague, ask a direct follow-up.
INTERVIEW RULES: Ask ONE focused question at a time. Build on what the candidate just said. Output the question only - no meta-commentary.`,
  },
  {
    id: "tough", label: "Tough", emoji: "🔥",
    desc: "Demanding, pressure-test your limits", color: "#ef4444",
    system: (role, level) => `You are Morgan, a demanding principal engineer at a FAANG-level company. You are interviewing a ${level} ${role} candidate.
YOUR STYLE: Direct, skeptical by default. Challenge vague answers immediately. Never accept buzzwords without proof.
INTERVIEW RULES: Ask ONE precise, probing question at a time. Each question should be harder than the previous. Output the question only - no filler.`,
  },
];

export const JOB_SITES = [
  { name: "Wellfound",        desc: "Startups with transparent salary and equity upfront",      url: "https://wellfound.com",               tag: "Startups" },
  { name: "FlexJobs",         desc: "Remote jobs in 50+ fields, all verified listings",         url: "https://flexjobs.com",                tag: "Remote" },
  { name: "We Work Remotely", desc: "100% remote roles in IT, marketing and design",            url: "https://weworkremotely.com",          tag: "Remote" },
  { name: "Jobfound Remote",  desc: "High quality remote job listings",                         url: "https://jobfound.org",                tag: "Remote" },
  { name: "Himalayas",        desc: "Remote jobs with timezone and visa filters",               url: "https://himalayas.app",               tag: "Remote" },
  { name: "RemoteOK",         desc: "Remote job aggregator, filter by skills and salary",       url: "https://remoteok.com",                tag: "Remote" },
  { name: "Pallet",           desc: "Curated job boards for specific communities",              url: "https://pallet.xyz",                  tag: "Curated" },
  { name: "Jaabz",            desc: "IT jobs with visa, salary and industry filters",           url: "https://jaabz.com",                   tag: "IT" },
  { name: "Built In",         desc: "Local tech hubs across US cities (NY, SF, Boston...)",    url: "https://builtin.com",                 tag: "USA" },
  { name: "Levels.fyi",       desc: "Big Tech and IT companies with salary data",               url: "https://levels.fyi",                  tag: "Big Tech" },
  { name: "DICE",             desc: "Large selection of developer and IT roles",                url: "https://dice.com",                    tag: "Dev" },
  { name: "Job Hunt",         desc: "AI-powered job search assistant and resume builder",       url: "https://job-hunt.org",                tag: "AI Tools" },
  { name: "Remotive",         desc: "Vetted remote jobs at trusted tech companies",             url: "https://remotive.com",                tag: "Remote" },
  { name: "Pyjama Jobs",      desc: "AI matches you to roles where you are a strong fit",       url: "https://kickresume.com/pyjama-jobs",  tag: "AI Tools" },
  { name: "Toptal",           desc: "Top 3% freelancers in dev, design, finance and PM",       url: "https://toptal.com",                  tag: "Freelance" },
  { name: "JS Remotely",      desc: "Remote roles for React, Vue, Node and Angular devs",      url: "https://jsremotely.com",              tag: "JS/Frontend" },
  { name: "Working Nomads",   desc: "Remote listings for digital nomads in tech and marketing", url: "https://workingnomads.com",           tag: "Nomad" },
];

export const DEFAULT_DURATION = 20 * 60;

export function fmt(s) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export function parseFeedback(text) {
  const sections = {};
  const patterns = {
    score:     /OVERALL[_\s]SCORE[:\s]+(\d+)/i,
    strengths: /STRENGTHS[:\s]+([\s\S]*?)(?=WEAK|IMPROV|TIP|VERDICT|$)/i,
    weaknesses:/(?:WEAKNESSES|IMPROVE)[:\s]+([\s\S]*?)(?=TIP|VERDICT|$)/i,
    tips:      /TIPS[:\s]+([\s\S]*?)(?=VERDICT|$)/i,
    verdict:   /VERDICT[:\s]+([\s\S]*?)$/i,
  };
  for (const [k, re] of Object.entries(patterns)) {
    const m = text.match(re);
    if (m) sections[k] = m[1].trim();
  }
  return sections;
}

export const styles = {
  chip:   { display: "inline-block", background: "#EAF7F6", color: "#2d7a76", borderRadius: 30, padding: "5px 16px", fontSize: 11.5, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 },
  h1:     { fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 800, lineHeight: 1.15, color: "#1F2937", margin: "0 0 14px" },
  h2:     { fontSize: "clamp(1.5rem,3vw,2.2rem)", fontWeight: 800, color: "#1F2937", margin: "0 0 24px" },
  sub:    { fontSize: 17, color: "#6B7280", maxWidth: 540, margin: "0 auto 36px", lineHeight: 1.65 },
  row:    { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" },
  bigBtn: { background: "#45A29E", color: "white", border: "none", borderRadius: 30, padding: "14px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 20px #45A29E44", fontFamily: "inherit", transition: "all .2s", display: "inline-flex", alignItems: "center", gap: 8 },
  card:   { background: "white", borderRadius: 20, padding: 22, border: "1.5px solid #b8e8e5", boxShadow: "0 2px 16px rgba(69,162,158,0.08)" },
  grid3:  { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16 },
  tag:    { background: "#EAF7F6", color: "#2d7a76", borderRadius: 30, padding: "4px 12px", fontSize: 11, fontWeight: 700 },
};

export const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap');
  @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes wave   { 0%,100%{height:6px} 50%{height:26px} }
  * { box-sizing:border-box; }
  body { margin:0; }
  .btn-hover:hover { transform:translateY(-2px); box-shadow:0 8px 28px #45A29E66 !important; }
  .card-hover:hover { border-color:#45A29E !important; transform:translateY(-3px); box-shadow:0 8px 24px #45A29E22 !important; }
  @media(max-width:640px){
    .hide-mobile{ display:none !important; }
    .mobile-col{ flex-direction:column !important; }
    .mobile-full{ width:100% !important; }
    .mobile-pad{ padding:40px 20px !important; }
    .mobile-center{ text-align:center !important; }
    .grid-2col{ grid-template-columns:1fr 1fr !important; }
  }
`;
