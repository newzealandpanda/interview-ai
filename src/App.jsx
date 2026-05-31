import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase.js";

// ── PALETTE ──────────────────────────────────────────────────────────────────
const T    = "#45A29E";   // Tiffany Primary
const TD   = "#2d7a76";   // Tiffany Dark
const TL   = "#EAF7F6";   // Tiffany Light
const TM   = "#b8e8e5";   // Tiffany Mid
const DARK = "#1F2937";   // Deep Charcoal
const GREY = "#6B7280";   // Muted Grey
const BG   = "#F9FBFB";   // Background Soft

// ── DATA ─────────────────────────────────────────────────────────────────────
// Sprite icon helper - crops icon from robots.png sprite bottom section
// Icons are in a grid in the bottom half of the image
// Row 1 (roles): QA, Frontend, Backend | Row 2: DevOps, PM, ML
// Row 3 (levels): Junior, Middle, Senior, Expert
function SpriteIcon({ col, row, size = 52 }) {
  // robots.png is ~1080x1080px
  // Top half (0-540px): robots. Bottom half (540-1080px): icons
  // Icons area: row0=roles top, row1=roles bottom, row2=levels
  // Each icon ~180px wide, ~180px tall in original
  const spriteW = 1080;
  const spriteH = 1080;
  const iconAreaTop = 540;   // icons start at ~50% down
  const iconW = 180;
  const iconH = 170;
  const scale = size / iconW;
  return (
    <div style={{ width: size, height: size, overflow: "hidden", position: "relative", flexShrink: 0 }}>
      <img
        src="/robots.png"
        alt=""
        style={{
          position: "absolute",
          width: spriteW * scale,
          height: "auto",
          top: -(iconAreaTop + row * iconH) * scale,
          left: -(col * iconW) * scale,
          maxWidth: "none",
        }}
      />
    </div>
  );
}

const ROLES = [
  { id: "qa",       label: "QA Engineer",       icon: "/icon-qa.png" },
  { id: "frontend", label: "Frontend Developer", icon: "/icon-frontend.png" },
  { id: "backend",  label: "Backend Developer",  icon: "/icon-backend.png" },
  { id: "devops",   label: "DevOps / SRE",       icon: "/icon-devops.png" },
  { id: "pm",       label: "Product Manager",    icon: "/icon-pm.png" },
  { id: "data",     label: "Data Engineer / ML", icon: "/icon-ml.png" },
];

const LEVELS = [
  { id: "junior", label: "Junior", desc: "0-2 years", icon: "/icon-junior.png" },
  { id: "middle", label: "Middle", desc: "2-5 years", icon: "/icon-middle.png" },
  { id: "senior", label: "Senior", desc: "5+ years",  icon: "/icon-senior.png" },
  { id: "expert", label: "Expert", desc: "10+ years", icon: "/icon-expert.png" },
];

const MODES = [
  {
    id: "friendly",
    label: "Friendly",
    emoji: "😊",
    desc: "Supportive, encouraging atmosphere",
    color: "#22c55e",
    system: (role, level) => `You are Jamie, a warm and encouraging interviewer at a growing tech company. You are interviewing a ${level} ${role} candidate.

YOUR PERSONALITY:
- Genuinely supportive and patient — your goal is to help the candidate show their best self
- When an answer is unclear, ask a gentle clarifying question rather than challenging directly
- Occasionally acknowledge when an answer was good (briefly, once per topic max)
- Create a conversational, low-pressure atmosphere

INTERVIEW RULES:
- Ask ONE question at a time — natural, conversational
- React specifically to what was just said — don't ask random questions
- Follow up on interesting points they mention (technologies, projects, decisions)
- If an answer is very brief, gently encourage more: "Could you tell me a bit more about that?"
- Cover a mix of: experience, technical knowledge, problem-solving, teamwork
- Output the question only — no preamble, no lengthy commentary`
  },
  {
    id: "normal",
    label: "Normal",
    emoji: "💼",
    desc: "Professional, realistic interview",
    color: T,
    system: (role, level) => `You are Alex, a professional senior interviewer at a top tech company. You are interviewing a ${level} ${role} candidate.

YOUR STYLE:
- Neutral, professional tone — neither harsh nor overly warm
- Evaluate both technical depth and communication clarity
- If an answer is vague, ask a direct follow-up: "Can you be more specific?" or "What was your exact approach there?"
- Don't accept buzzwords without substance — probe for real experience

INTERVIEW RULES:
- Ask ONE focused question at a time
- Build on what the candidate just said — every question must connect to their answer
- Balance: technical skills, past experience, decision-making, behavioral situations
- If time < 3 min OR questions >= MAX — output only: END_INTERVIEW
- Output the question only — no preamble, no meta-commentary`
  },
  {
    id: "tough",
    label: "Tough",
    emoji: "🔥",
    desc: "Demanding, pressure-test your limits",
    color: "#ef4444",
    system: (role, level) => `You are Morgan, a demanding principal engineer and interviewer at a FAANG-level company. You are interviewing a ${level} ${role} candidate and your bar is exceptionally high.

YOUR STYLE:
- Direct, no-nonsense, skeptical by default
- Treat every claim as unverified until the candidate proves it with specifics
- Challenge vague answers immediately: "That's quite general — what did YOU specifically do?"
- If they mention a technology, dig into edge cases, trade-offs, and failure modes
- Never accept "we used X" — ask "why X over Y?", "what went wrong?", "what would you do differently?"
- Comfortable with silence — don't soften questions

INTERVIEW RULES:
- Ask ONE precise, probing question at a time
- Each question should be harder or more specific than the previous based on their answer
- Probe for: depth of knowledge, real ownership, handling failure, technical trade-offs
- If the answer is strong — escalate to a harder edge case or system design question
- Output the question only — absolutely no filler, no praise, no softening`
  },
];

const JOB_SITES = [
  { name: "Wellfound",          desc: "Startups with transparent salary and equity upfront",     url: "https://wellfound.com",                  tag: "Startups" },
  { name: "FlexJobs",           desc: "Remote jobs in 50+ fields, all verified listings",        url: "https://flexjobs.com",                   tag: "Remote" },
  { name: "We Work Remotely",   desc: "100% remote roles in IT, marketing and design",           url: "https://weworkremotely.com",             tag: "Remote" },
  { name: "Jobfound Remote",    desc: "High quality remote job listings",                        url: "https://jobfound.org",                   tag: "Remote" },
  { name: "Himalayas",          desc: "Remote jobs with timezone and visa filters",              url: "https://himalayas.app",                  tag: "Remote" },
  { name: "RemoteOK",           desc: "Remote job aggregator, filter by skills and salary",      url: "https://remoteok.com",                   tag: "Remote" },
  { name: "Pallet",             desc: "Curated job boards for specific communities",             url: "https://pallet.xyz",                     tag: "Curated" },
  { name: "Jaabz",              desc: "IT jobs with visa, salary and industry filters",          url: "https://jaabz.com",                      tag: "IT" },
  { name: "Built In",           desc: "Local tech hubs across US cities (NY, SF, Boston...)",   url: "https://builtin.com",                    tag: "USA" },
  { name: "Levels.fyi",         desc: "Big Tech and IT companies with salary data",              url: "https://levels.fyi",                     tag: "Big Tech" },
  { name: "DICE",               desc: "Large selection of developer and IT roles",               url: "https://dice.com",                       tag: "Dev" },
  { name: "Job Hunt",           desc: "AI-powered job search assistant and resume builder",      url: "https://job-hunt.org",                   tag: "AI Tools" },
  { name: "Remotive",           desc: "Vetted remote jobs at trusted tech companies",            url: "https://remotive.com",                   tag: "Remote" },
  { name: "Pyjama Jobs",        desc: "AI matches you to roles where you are a strong fit",      url: "https://kickresume.com/pyjama-jobs",     tag: "AI Tools" },
  { name: "Toptal",             desc: "Top 3% freelancers in dev, design, finance and PM",      url: "https://toptal.com",                     tag: "Freelance" },
  { name: "JS Remotely",        desc: "Remote roles for React, Vue, Node and Angular devs",     url: "https://jsremotely.com",                 tag: "JS/Frontend" },
  { name: "Working Nomads",     desc: "Remote listings for digital nomads in tech and marketing",url: "https://workingnomads.com",              tag: "Nomad" },
];

const DEFAULT_DURATION = 20 * 60; // fallback

// ── HELPERS ───────────────────────────────────────────────────────────────────
function fmt(s) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function parseFeedback(text) {
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

// ── WAVEFORM ANIMATION ────────────────────────────────────────────────────────
function Waveform({ active, color = T }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 32 }}>
      {[...Array(7)].map((_, i) => (
        <div key={i} style={{
          width: 4, borderRadius: 99,
          background: color,
          height: active ? undefined : 6,
          animation: active ? `wave 1.1s ease-in-out infinite` : "none",
          animationDelay: `${i * 0.12}s`,
          minHeight: 4, maxHeight: 28,
        }} />
      ))}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]           = useState("home");
  const [user, setUser]           = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);   // home | select | interview | feedback | resources
  const [role, setRole]           = useState(null);
  const [level, setLevel]         = useState(null);
  const [mode, setMode]           = useState(null);
  const [duration, setDuration]   = useState(20); // minutes
  const [qIndex, setQIndex]       = useState(0);
  const [timeLeft, setTimeLeft]   = useState(DEFAULT_DURATION);
  const [running, setRunning]     = useState(false);
  const [transcript, setTranscript] = useState([]);     // [{role,text}]
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking]   = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [feedbackRaw, setFeedbackRaw] = useState("");
  const [loadingFB, setLoadingFB] = useState(false);
  const [micAllowed, setMicAllowed] = useState(null);   // null|true|false

  const timerRef    = useRef(null);
  const synthRef    = useRef(window.speechSynthesis);
  const recognRef   = useRef(null);
  const sessionRef  = useRef([]);   // mirror of transcript for async access
  const endedRef    = useRef(false);

  const questionsAsked = useRef(0);
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); endSession(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [running]);

  // ── TTS ───────────────────────────────────────────────────────────────────
  const speak = useCallback((text, onDone) => {
    const synth = synthRef.current;
    synth.cancel();

    const doSpeak = () => {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "en-US";
      utt.rate = 0.93;
      utt.pitch = 1.0;
      const voices = synth.getVoices();
      // Priority: Google US English > Microsoft > any en-US > any en
      const voice =
        voices.find(v => v.name === "Google US English") ||
        voices.find(v => /microsoft.*english/i.test(v.name) && v.lang === "en-US") ||
        voices.find(v => v.lang === "en-US") ||
        voices.find(v => v.lang.startsWith("en"));
      if (voice) utt.voice = voice;
      setSpeaking(true);
      utt.onend = () => { setSpeaking(false); onDone && onDone(); };
      utt.onerror = () => { setSpeaking(false); onDone && onDone(); };
      synth.speak(utt);
    };

    // Voices may not be loaded yet on first call
    const voices = synth.getVoices();
    if (voices.length > 0) {
      doSpeak();
    } else {
      synth.onvoiceschanged = () => { synth.onvoiceschanged = null; doSpeak(); };
    }
  }, []);

  // ── STT ───────────────────────────────────────────────────────────────────
  const startListening = useCallback((onResult) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setStatusMsg("Speech recognition not supported in this browser."); return; }

    const rec = new SR();
    recognRef.current = rec;
    rec.lang = "en-US";
    rec.interimResults = true;       // show live transcript as user speaks
    rec.maxAlternatives = 1;
    rec.continuous = true;           // keep listening until silence detected

    let finalText = "";
    let silenceTimer = null;
    const SILENCE_MS = 2200;         // stop 2.2s after user stops speaking

    setListening(true);
    setStatusMsg("🎙 Listening...");

    rec.onresult = (e) => {
      let interim = "";
      finalText = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalText += e.results[i][0].transcript + " ";
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      // Show live interim text
      setStatusMsg("🎙 " + (finalText + interim).trim());

      // Reset silence timer every time speech is detected
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        const result = finalText.trim() || (finalText + interim).trim();
        if (result.length > 2) {
          rec.stop();
          setListening(false);
          setStatusMsg("");
          onResult(result);
        }
      }, SILENCE_MS);
    };

    rec.onerror = (e) => {
      clearTimeout(silenceTimer);
      if (e.error === "no-speech") {
        // restart if no speech detected
        setStatusMsg("🎙 No speech detected, listening again...");
        rec.stop();
        setTimeout(() => { if (!endedRef.current) startListening(onResult); }, 500);
      } else {
        setListening(false);
        setStatusMsg("Mic error: " + e.error + ". Try again.");
      }
    };

    rec.onend = () => {
      clearTimeout(silenceTimer);
      // If we got text, it was already handled above
      // If rec ended without result (e.g. timeout), restart
      if (finalText.trim().length === 0 && !endedRef.current) {
        setListening(false);
      }
    };

    rec.start();
  }, []);

  // ── GROQ API CALL ─────────────────────────────────────────────────────────
  async function askGroq(messages, system) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, system }),
    });
    const data = await res.json();
    return data.text || "";
  }

  // ── SESSION FLOW ──────────────────────────────────────────────────────────
  const conversationRef = useRef([]);
  const MIN_QUESTIONS = 5;
  const MAX_QUESTIONS = 12;

  async function runInterviewTurn() {
    if (endedRef.current) return;

    const asked = questionsAsked.current;
    const timeRemaining = timeLeft;

    setStatusMsg("AI is thinking...");
    setSpeaking(true);

    // Build full conversation history for context
    const history = conversationRef.current;

    const currentMode = mode || MODES[1];
    const system = currentMode.system(role?.label || "IT professional", level?.label || "Mid-level") + `

CONTEXT:
- Questions asked so far: ${asked}
- Time remaining: ${Math.floor(timeRemaining / 60)} min
- Total session duration: ${duration} min
- Min questions: ${MIN_QUESTIONS}, Max: ${MAX_QUESTIONS}
- If questions asked < ${MIN_QUESTIONS} — always continue
- If time < 3 min OR questions >= ${MAX_QUESTIONS} — output only: END_INTERVIEW`;

    try {
      const response = await askGroq(history, system);
      setSpeaking(false);
      setStatusMsg("");

      if (!response || endedRef.current) return;

      if (response.trim().toUpperCase().includes("END_INTERVIEW") || asked >= MAX_QUESTIONS) {
        // Say goodbye before ending
        const bye = "That's all the questions I have. Thank you for your time — I'll now prepare your feedback.";
        speak(bye, () => endSession());
        return;
      }

      questionsAsked.current += 1;
      setQIndex(questionsAsked.current);

      const aiEntry = { role: "ai", text: response };
      setTranscript(prev => [...prev, aiEntry]);
      sessionRef.current = [...sessionRef.current, aiEntry];

      // Add to conversation history BEFORE speaking
      conversationRef.current = [...conversationRef.current, { role: "assistant", content: response }];

      speak(response, () => {
        if (endedRef.current) return;
        startListening((userText) => {
          if (endedRef.current) return;
          const uEntry = { role: "user", text: userText };
          setTranscript(prev => [...prev, uEntry]);
          sessionRef.current = [...sessionRef.current, uEntry];

          // Add user answer to history BEFORE next turn
          conversationRef.current = [...conversationRef.current, { role: "user", content: userText }];

          runInterviewTurn();
        });
      });
    } catch {
      setSpeaking(false);
      setStatusMsg("Connection error, retrying...");
      setTimeout(() => { if (!endedRef.current) runInterviewTurn(); }, 2000);
    }
  }

  async function startSession() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setMicAllowed(false); return; }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicAllowed(true);
    } catch {
      setMicAllowed(false); return;
    }
    endedRef.current = false;
    sessionRef.current = [];
    conversationRef.current = [];
    questionsAsked.current = 0;
    setTranscript([]);
    setQIndex(0);
    setTimeLeft(duration * 60);
    setRunning(true);
    setPage("interview");

    // Seed the conversation so AI knows the context from the start
    conversationRef.current = [{
      role: "user",
      content: `[START] Mock interview for ${level?.label} ${role?.label}. Mode: ${mode?.label || "Normal"}. Begin with an opening question or ask them to introduce themselves.`
    }];

    const greetings = {
      friendly: `Hi there! I'm Jamie, and I'll be your interviewer today. Don't worry — this is a relaxed conversation. We have ${duration} minutes and I'll ask you some questions about your experience as a ${level?.label} ${role?.label}. Take your time and speak naturally. Ready to begin?`,
      normal:   `Hello, I'm Alex. Thanks for joining. We have ${duration} minutes today. I'll be asking questions relevant to a ${level?.label} ${role?.label} role. Let's get started.`,
      tough:    `Let's begin. ${duration} minutes, ${level?.label} ${role?.label} position. I expect specific, detailed answers. Vague responses will be followed up on. Introduce yourself.`,
    };
    const greeting = greetings[mode?.id || "normal"];
    speak(greeting, () => runInterviewTurn());
  }

  function endSession() {
    if (endedRef.current) return;
    endedRef.current = true;
    clearInterval(timerRef.current);
    setRunning(false);
    recognRef.current?.abort();
    synthRef.current.cancel();
    setSpeaking(false);
    setListening(false);
    generateFeedback();
  }

  async function generateFeedback() {
    setPage("feedback");
    setLoadingFB(true);
    const answers = sessionRef.current.filter(e => e.role === "user").map(e => e.text);
    const conv = sessionRef.current.map(e => `${e.role === "ai" ? "Interviewer" : "Candidate"}: ${e.text}`).join("\n");

    if (answers.length === 0) {
      setFeedbackRaw("OVERALL_SCORE: N/A\nVERDICT: No answers were recorded. Please try again and make sure your microphone is working.");
      setLoadingFB(false);
      return;
    }

    try {
      const system = `You are a senior tech hiring manager giving feedback after a mock interview. Interview mode was: ${mode?.label || "Normal"} (${mode?.desc || "professional"}). Calibrate your tone and scoring accordingly — be strict for Tough mode, encouraging for Friendly mode.`;
      const prompt = `Analyze this mock interview for a ${level?.label} ${role?.label} role and give structured feedback.

TRANSCRIPT:
${conv}

Respond in this EXACT format:
OVERALL_SCORE: [1-10]
STRENGTHS:
• [point 1]
• [point 2]
• [point 3]
WEAKNESSES:
• [point 1]
• [point 2]
TIPS:
• [actionable tip 1]
• [actionable tip 2]
• [actionable tip 3]
VERDICT: [2-3 encouraging sentences about readiness and next steps]`;

      const text = await askGroq([{ role: "user", content: prompt }], system);
      const finalText = text || "OVERALL_SCORE: N/A\nVERDICT: Could not generate feedback. Please try again.";
      setFeedbackRaw(finalText);

      // Save to Supabase if user is logged in
      if (user) {
        const scoreMatch = finalText.match(/OVERALL_SCORE[:\s]+(\d+)/i);
        const verdictMatch = finalText.match(/VERDICT[:\s]+([\s\S]*?)$/i);
        await supabase.from("interview_results").insert({
          user_id: user.id,
          role: role?.label,
          level: level?.label,
          mode: mode?.label,
          duration,
          score: scoreMatch ? parseInt(scoreMatch[1]) : null,
          answers_count: answers.length,
          feedback_raw: finalText,
          verdict: verdictMatch ? verdictMatch[1].trim().slice(0, 500) : "",
        });
      }
    } catch {
      setFeedbackRaw("OVERALL_SCORE: N/A\nVERDICT: Could not connect to AI feedback service. Please check your connection.");
    }
    setLoadingFB(false);
  }

  const fb = parseFeedback(feedbackRaw);
  const totalSec = duration * 60;
  const pct = Math.round(((totalSec - timeLeft) / totalSec) * 100);
  const timerColor = timeLeft < 120 ? "#ff6b6b" : timeLeft < 300 ? "#f59e0b" : T;

  // ══════════════════════════════════════════════════════════════════════════
  // PAGES
  // ══════════════════════════════════════════════════════════════════════════

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (page === "home") return (
    <Shell active="home" onNav={setPage} user={user} onLogout={async () => { await supabase.auth.signOut(); setUser(null); setPage("home"); }}>
      {/* HERO */}
      <div style={{ background: `linear-gradient(160deg, ${TL} 0%, white 60%)`, padding: "60px 5% 0", position: "relative", overflow: "hidden" }}>

        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap" }}>
          {/* Left - text */}
          <div style={{ flex: "1 1 340px", minWidth: 280, animation: "fadeIn .6s ease" }} className="mobile-center">
            <div style={styles.chip}>✦ AI Voice Interview Prep</div>
            <h1 style={{ ...styles.h1, fontSize: "clamp(2rem,4.5vw,3.2rem)" }}>
              Practice interviews<br />
              <span style={{ color: T }}>by voice,</span><br />
              get hired faster
            </h1>
            <p style={{ ...styles.sub, margin: "0 0 32px", textAlign: "left" }} className="mobile-center">
              Real-time AI mock interviews for QA, Frontend, Backend, DevOps, PM and Data roles. Speak your answers and get instant AI feedback.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="btn-hover" style={styles.bigBtn} onClick={() => setPage("select")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                Start Voice Interview
              </button>
              <button className="btn-hover" style={{ ...styles.bigBtn, background: "white", color: TD, border: `1.5px solid ${TM}`, boxShadow: "none" }} onClick={() => setPage("resources")}>
                View Job Sites →
              </button>
            </div>
          </div>

          {/* Right - Robot + UI preview */}
          <div style={{ flex: "1 1 320px", minWidth: 280, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 0, animation: "fadeIn .8s .2s both" }}>
            {/* Robot sitting - left half of sprite */}
            <div style={{ animation: "float 4s ease-in-out infinite", flexShrink: 0, marginRight: -16, zIndex: 2 }}>
              <img src="/robot-sitting.png" alt="AI Interviewer" style={{ width: 180, height: "auto", mixBlendMode: "multiply" }} />
            </div>

            {/* Chat preview card */}
            <div style={{ background: "white", borderRadius: 20, boxShadow: `0 16px 48px ${T}22`, border: `1.5px solid ${TM}`, overflow: "hidden", width: "min(320px, 100%)", marginBottom: 20 }}>
              <div style={{ background: DARK, padding: "10px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57", display: "inline-block" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e", display: "inline-block" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: T, display: "inline-block" }} />
                <span style={{ color: TM, fontSize: 11, fontWeight: 600, marginLeft: 6 }}>Live Voice Session</span>
                <span style={{ marginLeft: "auto", color: "#ff6b6b", fontSize: 11, fontWeight: 700 }}>● REC</span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: TL, border: `1.5px solid ${T}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>🤖</div>
                  <div style={{ background: TL, borderRadius: "0 12px 12px 12px", padding: "9px 12px", fontSize: 13, color: DARK, lineHeight: 1.5 }}>How do you handle flaky tests in Playwright?</div>
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginBottom: 14 }}>
                  <div style={{ background: BG, border: `1px solid ${TM}`, borderRadius: "12px 0 12px 12px", padding: "9px 12px", fontSize: 13, color: DARK, lineHeight: 1.5 }}>I use retry logic and Playwright's built-in retry option...</div>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: TL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>🧑</div>
                </div>
                <Waveform active={true} color={T} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ padding: "64px 5%", background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ ...styles.h2, textAlign: "center", marginBottom: 8 }}>Everything in one place</h2>
          <p style={{ color: GREY, textAlign: "center", marginBottom: 40, fontSize: 15 }}>All the tools you need to land your next IT role.</p>
          <div style={styles.grid3}>
            {[
              ["/voice-first.png",          "Voice-First",        "Speak naturally, no typing. The AI listens, responds, and tracks the whole conversation."],
              ["/20-min-session.png",        "20-Min Sessions",    "Realistic time pressure. A countdown keeps you sharp, just like a real phone screen."],
              ["/ai-score.png",             "AI Score & Feedback","Strengths, weaknesses, and actionable tips generated by AI after every session."],
              ["/6-profiles.png",           "6 IT Roles",         "QA, Frontend, Backend, DevOps, PM, Data Engineering — all covered with tailored questions."],
              ["/job-site-directory.png",   "Job Site Directory", "17 curated remote-friendly job boards — from Wellfound to Levels.fyi."],
              ["/free-and-opensource.png",  "Free & Open Source", "No login, no paywall. Deploy on GitHub and Vercel in minutes."],
            ].map(([img, title, desc], i) => (
              <div key={i} className="card-hover" style={{ ...styles.card, transition: "all .2s", cursor: "default" }}>
                <img src={img} alt={title} style={{ width: 52, height: 52, objectFit: "contain", marginBottom: 14, mixBlendMode: "multiply" }} />
                <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: DARK }}>{title}</h4>
                <p style={{ color: GREY, fontSize: 13.5, margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CtaBanner onStart={() => setPage("select")} />
    </Shell>
  );

  // ── SELECT ROLE ───────────────────────────────────────────────────────────
  if (page === "select") return (
    <Shell active="select" onNav={setPage} user={user} onLogout={async () => { await supabase.auth.signOut(); setUser(null); setPage("home"); }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "52px 5%" }}>

        {/* STEP 1 - ROLE */}
        <div style={styles.chip}>Step 1 of 4</div>
        <h2 style={{ ...styles.h2, marginBottom: 6 }}>Choose Your Role</h2>
        <p style={{ color: GREY, marginBottom: 28, fontSize: 15 }}>Questions will be tailored to your specialization.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }} className="grid-2col">
          {ROLES.map(r => (
            <div key={r.id} onClick={() => setRole(r)}
              style={{ ...styles.card, cursor: "pointer", transition: "all .18s", display: "flex", alignItems: "center", gap: 14,
                borderColor: role?.id === r.id ? T : TM,
                background: role?.id === r.id ? TL : "white",
                borderWidth: role?.id === r.id ? 2 : 1.5 }}
              onMouseEnter={e => { if (role?.id !== r.id) { e.currentTarget.style.borderColor = T; e.currentTarget.style.transform = "translateY(-2px)"; }}}
              onMouseLeave={e => { if (role?.id !== r.id) { e.currentTarget.style.borderColor = TM; e.currentTarget.style.transform = ""; }}}>
              <img src={r.icon} alt={r.label} style={{ width: 44, height: 44, objectFit: "contain", flexShrink: 0, mixBlendMode: "multiply" }} />
              <div style={{ fontWeight: 700, color: DARK, fontSize: 14 }}>{r.label}</div>
              {role?.id === r.id && <div style={{ marginLeft: "auto", color: T, fontSize: 16 }}>✓</div>}
            </div>
          ))}
        </div>

        {/* STEP 2 - LEVEL */}
        <div style={{ marginTop: 52 }}>
          <div style={styles.chip}>Step 2 of 4</div>
          <h2 style={{ ...styles.h2, marginBottom: 6 }}>Choose Your Level</h2>
          <p style={{ color: GREY, marginBottom: 28, fontSize: 15 }}>AI adjusts question complexity and scoring to your experience.</p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {LEVELS.map(lv => (
              <div key={lv.id} onClick={() => setLevel(lv)}
                style={{ ...styles.card, cursor: "pointer", transition: "all .18s", textAlign: "center", flex: "1 1 130px", minWidth: 110,
                  borderColor: level?.id === lv.id ? T : TM,
                  background: level?.id === lv.id ? TL : "white",
                  borderWidth: level?.id === lv.id ? 2 : 1.5 }}
                onMouseEnter={e => { if (level?.id !== lv.id) { e.currentTarget.style.borderColor = T; e.currentTarget.style.transform = "translateY(-2px)"; }}}
                onMouseLeave={e => { if (level?.id !== lv.id) { e.currentTarget.style.borderColor = TM; e.currentTarget.style.transform = ""; }}}>
                <img src={lv.icon} alt={lv.label} style={{ width: 44, height: 44, objectFit: "contain", margin: "0 auto 10px", display: "block", mixBlendMode: "multiply" }} />
                <div style={{ fontWeight: 700, color: DARK, fontSize: 14, marginBottom: 3 }}>{lv.label}</div>
                <div style={{ fontSize: 11.5, color: GREY }}>{lv.desc}</div>
                {level?.id === lv.id && <div style={{ marginTop: 6, color: T, fontSize: 14, fontWeight: 700 }}>✓</div>}
              </div>
            ))}
          </div>

          {/* STEP 3 - MODE */}
        <div style={{ marginTop: 52 }}>
          <div style={styles.chip}>Step 3 of 4</div>
          <h2 style={{ ...styles.h2, marginBottom: 6 }}>Choose Your Interviewer</h2>
          <p style={{ color: GREY, marginBottom: 28, fontSize: 15 }}>Each mode changes the tone, pressure, and feedback style.</p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {MODES.map(m => (
              <div key={m.id} onClick={() => setMode(m)}
                style={{ ...styles.card, cursor: "pointer", transition: "all .18s", flex: "1 1 180px", minWidth: 160,
                  borderColor: mode?.id === m.id ? m.color : TM,
                  background: mode?.id === m.id ? TL : "white",
                  borderWidth: mode?.id === m.id ? 2 : 1.5 }}
                onMouseEnter={e => { if (mode?.id !== m.id) { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.transform = "translateY(-2px)"; }}}
                onMouseLeave={e => { if (mode?.id !== m.id) { e.currentTarget.style.borderColor = TM; e.currentTarget.style.transform = ""; }}}>
                <img src={`/${m.id}.png`} alt={m.label} style={{ width: 80, height: 80, objectFit: "contain", marginBottom: 10, mixBlendMode: "multiply", display: "block" }} />
                <div style={{ fontWeight: 700, color: DARK, fontSize: 15, marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 13, color: GREY, lineHeight: 1.4 }}>{m.desc}</div>
                {mode?.id === m.id && <div style={{ marginTop: 8, color: m.color, fontSize: 13, fontWeight: 700 }}>Selected ✓</div>}
              </div>
            ))}
          </div>
        </div>

        {/* STEP 4 - DURATION */}
        <div style={{ marginTop: 52 }}>
          <div style={styles.chip}>Step 4 of 4</div>
          <h2 style={{ ...styles.h2, marginBottom: 6 }}>Session Duration</h2>
          <p style={{ color: GREY, marginBottom: 28, fontSize: 15 }}>How long do you want your interview to be?</p>
          <div style={{ ...styles.card, padding: "28px 32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ color: GREY, fontSize: 14 }}>1 min</span>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: T }}>{duration}</span>
                <span style={{ fontSize: 16, color: GREY, fontWeight: 500 }}> min</span>
              </div>
              <span style={{ color: GREY, fontSize: 14 }}>60 min</span>
            </div>
            <input
              type="range"
              min={1} max={60} step={1}
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              style={{ width: "100%", accentColor: T, height: 6, cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, gap: 8, flexWrap: "wrap" }}>
              {[5, 10, 15, 20, 30, 45, 60].map(d => (
                <button key={d} onClick={() => setDuration(d)}
                  style={{ flex: "1 1 40px", padding: "7px 0", borderRadius: 30, border: `1.5px solid ${duration === d ? T : TM}`, background: duration === d ? TL : "white", color: duration === d ? TD : GREY, fontWeight: duration === d ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
                  {d}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Robot helper */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end", gap: 12, marginTop: 24 }}>
            <div style={{ background: "white", border: `1.5px solid ${TM}`, borderRadius: "16px 16px 0 16px", padding: "10px 16px", fontSize: 13, color: DARK, fontWeight: 500, boxShadow: `0 4px 12px ${T}18` }}>
              {!role ? "Choose your role to begin." : !level ? "Great! Now pick your level." : !mode ? "Now choose your interviewer." : "You're all set — let's go! 🚀"}
            </div>
            {/* Standing robot - right half of sprite */}
            <div style={{ flexShrink: 0, animation: "float 3s ease-in-out infinite" }}>
              <img src="/robot-standing.png" alt="Robot" style={{ width: 90, height: "auto", mixBlendMode: "multiply" }} />
            </div>
          </div>
        </div>

        {micAllowed === false && (
          <div style={{ marginTop: 20, background: "#fff0f0", border: "1.5px solid #fca5a5", borderRadius: 16, padding: 16, color: "#b91c1c", fontSize: 14 }}>
            Microphone access was denied. Please allow it in your browser settings and reload.
          </div>
        )}

        <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn-hover" style={{ ...styles.bigBtn, opacity: (role && level && mode) ? 1 : 0.45 }} disabled={!role || !level || !mode} onClick={startSession}>
            🎤 Start Interview
          </button>
          <button style={{ ...styles.bigBtn, background: "white", color: TD, border: `1.5px solid ${TM}`, boxShadow: "none" }} onClick={() => setPage("home")}>Back</button>
        </div>
      </div>
    </Shell>
  );

  // ── INTERVIEW ─────────────────────────────────────────────────────────────
  if (page === "interview") return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: DARK, minHeight: "100vh", color: "white" }}>
      <style>{CSS}</style>
      {/* top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5%", height: 60, borderBottom: "1px solid #1e3535" }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: T }}>InterviewAI <span style={{ color: TM, fontSize: 11, fontWeight: 500 }}>- {mode?.emoji} {mode?.label} · {level?.label} {role?.label} · {duration}min</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: timerColor, fontVariantNumeric: "tabular-nums", transition: "color 0.5s" }}>{fmt(timeLeft)}</div>
          <button onClick={endSession} style={{ background: "#1e3535", color: "#ff6b6b", border: "1px solid #ff6b6b55", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>End Session</button>
        </div>
      </div>

      {/* progress */}
      <div style={{ height: 3, background: "#1e3535" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${T},${TD})`, transition: "width 1s linear" }} />
      </div>

      {/* transcript */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 5%", display: "flex", flexDirection: "column", gap: 14, minHeight: "calc(100vh - 180px)", overflowY: "auto" }}>
        {transcript.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", justifyContent: e.role === "user" ? "flex-end" : "flex-start", animation: "fadeIn .4s ease" }}>
            {e.role === "ai" && <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${T},${TD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🤖</div>}
            <div style={{ background: e.role === "ai" ? "#1a3535" : "#0a2828", border: `1px solid ${e.role === "ai" ? "#2a4545" : T + "44"}`, borderRadius: e.role === "ai" ? "0 12px 12px 12px" : "12px 0 12px 12px", padding: "11px 15px", fontSize: 14, lineHeight: 1.6, maxWidth: 520, color: e.role === "ai" ? TM : "white" }}>
              {e.text}
            </div>
            {e.role === "user" && <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1a3535", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🧑</div>}
          </div>
        ))}
      </div>

      {/* status bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0d2525", borderTop: "1px solid #1e3535", padding: "14px 5%", display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
        {speaking && <><Waveform active={true} color={T} /><span style={{ color: TM, fontSize: 13, fontWeight: 600 }}>AI is speaking...</span></>}
        {listening && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: 520, overflow: "hidden" }}>
            <Waveform active={true} color="#7fffaa" />
            <span style={{ color: "#7fffaa", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {statusMsg || "🎙 Listening..."}
            </span>
          </div>
        )}
        {!speaking && !listening && statusMsg && <span style={{ color: "#f59e0b", fontSize: 13 }}>{statusMsg}</span>}
        {!speaking && !listening && !statusMsg && <span style={{ color: "#4a7070", fontSize: 13 }}>Waiting...</span>}
      </div>
    </div>
  );

  // ── FEEDBACK ──────────────────────────────────────────────────────────────
  if (page === "feedback") return (
    <Shell active="" onNav={setPage} user={user} onLogout={async () => { await supabase.auth.signOut(); setUser(null); setPage("home"); }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "52px 5%" }}>
        <div style={styles.chip}>Session Complete</div>
        <h2 style={{ ...styles.h2, marginBottom: 6 }}>Your Interview Feedback</h2>
        <p style={{ color: GREY, marginBottom: 32 }}>Role: <strong style={{ color: DARK }}>{level?.label} {role?.label}</strong> · Mode: <strong style={{ color: mode?.color || T }}>{mode?.emoji} {mode?.label}</strong> · {transcript.filter(e => e.role === "user").length} answers recorded</p>

        {loadingFB ? (
          <div style={{ ...styles.card, textAlign: "center", padding: 56 }}>
            <svg width="60" height="72" viewBox="0 0 130 160" fill="none" style={{ animation: "float 2s ease-in-out infinite", marginBottom: 16 }}>
              <rect x="35" y="22" width="60" height="54" rx="20" fill="white" stroke={T} strokeWidth="2"/>
              <circle cx="52" cy="42" r="7" fill={TL} stroke={T} strokeWidth="1.5"/>
              <circle cx="78" cy="42" r="7" fill={TL} stroke={T} strokeWidth="1.5"/>
              <circle cx="54" cy="43" r="3" fill={T}/>
              <circle cx="80" cy="43" r="3" fill={T}/>
              <path d="M55 56 Q65 63 75 56" stroke={T} strokeWidth="2" strokeLinecap="round" fill="none"/>
            </svg>
            <p style={{ color: TD, fontWeight: 700, fontSize: 15 }}>Analyzing your interview...</p>
            <Waveform active={true} color={T} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn .5s ease" }}>
            {fb.score && (
              <div style={{ ...styles.card, display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ fontSize: 60, fontWeight: 800, color: T, lineHeight: 1, flexShrink: 0 }}>{fb.score}<span style={{ fontSize: 22, color: GREY }}>/10</span></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: DARK, marginBottom: 5 }}>Overall Score</div>
                  <div style={{ color: GREY, fontSize: 14 }}>{parseInt(fb.score) >= 7 ? "You're interview-ready! 🚀" : parseInt(fb.score) >= 5 ? "Good progress, keep practicing." : "Room to grow — practice makes perfect."}</div>
                </div>
              </div>
            )}
            {fb.verdict    && <FBCard icon="🏁" title="Verdict"          text={fb.verdict}    color={T}         />}
            {fb.strengths  && <FBCard icon="💪" title="Strengths"        text={fb.strengths}  color="#22c55e"   />}
            {fb.weaknesses && <FBCard icon="🔧" title="Areas to Improve" text={fb.weaknesses} color="#f59e0b"   />}
            {fb.tips       && <FBCard icon="💡" title="Tips for Next Time" text={fb.tips}     color={TD}        />}
            {!fb.score && feedbackRaw && <div style={{ ...styles.card, whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.7, color: GREY }}>{feedbackRaw}</div>}
          </div>
        )}

        <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn-hover" style={styles.bigBtn} onClick={() => { setPage("select"); setTranscript([]); setFeedbackRaw(""); setRole(null); setLevel(null); setMode(null); setDuration(20); }}>Practice Again</button>
          <button style={{ ...styles.bigBtn, background: "white", color: TD, border: `1.5px solid ${TM}`, boxShadow: "none" }} onClick={() => setPage("resources")}>View Job Sites →</button>
        </div>
      </div>
    </Shell>
  );

  // ── AUTH ──────────────────────────────────────────────────────────────────
  if (page === "login") return (
    <Shell active="login" onNav={setPage} user={user} onLogout={async () => { await supabase.auth.signOut(); setUser(null); setPage("home"); }}>
      <AuthPage onSuccess={(u) => { setUser(u); setPage("profile"); }} />
    </Shell>
  );

  // ── PROFILE ───────────────────────────────────────────────────────────────
  if (page === "profile") return (
    <Shell active="profile" onNav={setPage} user={user} onLogout={async () => { await supabase.auth.signOut(); setUser(null); setPage("home"); }}>
      <ProfilePage user={user} onLogin={() => setPage("login")} onDeleted={() => { setUser(null); setPage("home"); }} />
    </Shell>
  );

  // ── RESUME CHECK ──────────────────────────────────────────────────────────
  if (page === "resume") return (
    <Shell active="resume" onNav={setPage} user={user} onLogout={async () => { await supabase.auth.signOut(); setUser(null); setPage("home"); }}>
      <ResumePage />
    </Shell>
  );

  // ── RESOURCES ─────────────────────────────────────────────────────────────
  if (page === "resources") return (
    <Shell active="resources" onNav={setPage} user={user} onLogout={async () => { await supabase.auth.signOut(); setUser(null); setPage("home"); }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "52px 5%" }}>
        <div style={styles.chip}>Job Search</div>
        <h2 style={{ ...styles.h2, marginBottom: 6 }}>17 Best Job Sites for IT Professionals</h2>
        <p style={{ color: GREY, marginBottom: 36, fontSize: 15 }}>Curated from community recommendations. Remote-first, tech-focused.</p>
        <div style={styles.grid3}>
          {JOB_SITES.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
              <div className="card-hover" style={{ ...styles.card, cursor: "pointer", transition: "all .18s", height: "100%" }}>
                <span style={{ ...styles.tag, marginBottom: 12, display: "inline-block" }}>{s.tag}</span>
                <h4 style={{ fontWeight: 700, fontSize: 15, color: DARK, margin: "0 0 6px" }}>{s.name}</h4>
                <p style={{ color: GREY, fontSize: 13, margin: "0 0 12px", lineHeight: 1.5 }}>{s.desc}</p>
                <div style={{ fontSize: 12, color: T, fontWeight: 600 }}>{s.url.replace("https://", "")} ↗</div>
              </div>
            </a>
          ))}
        </div>
      </div>
      <CtaBanner onStart={() => setPage("select")} />
    </Shell>
  );

  return null;
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────
function ProfileDropdown({ user, onNav, onLogout, active }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", marginLeft: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: open || active === "profile" ? TL : T, color: open || active === "profile" ? TD : "white", border: `1.5px solid ${open || active === "profile" ? TM : T}`, borderRadius: 30, padding: "8px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, transition: "all .15s" }}>
        <span style={{ width: 22, height: 22, borderRadius: "50%", background: open || active === "profile" ? T : "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>
          {user.email?.[0]?.toUpperCase()}
        </span>
        Profile
        <span style={{ fontSize: 10, opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "white", borderRadius: 16, boxShadow: `0 8px 32px rgba(69,162,158,0.18)`, border: `1.5px solid ${TM}`, minWidth: 200, zIndex: 200, overflow: "hidden", animation: "fadeIn .15s ease" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${TM}`, background: TL }}>
            <div style={{ fontSize: 12, color: GREY, marginBottom: 2 }}>Signed in as</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
          </div>
          <div onClick={() => { onNav("profile"); setOpen(false); }}
            style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: DARK, transition: "background .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = TL}
            onMouseLeave={e => e.currentTarget.style.background = "white"}>
            👤 My Profile
          </div>
          <div onClick={() => { onLogout(); setOpen(false); }}
            style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: "#ef4444", borderTop: `1px solid ${TM}`, transition: "background .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#fff0f0"}
            onMouseLeave={e => e.currentTarget.style.background = "white"}>
            🚪 Sign Out
          </div>
        </div>
      )}
    </div>
  );
}

function Shell({ children, active, onNav, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: BG, minHeight: "100vh", color: DARK }}>
      <style>{CSS}</style>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5%", height: 64, background: "white", borderBottom: `1.5px solid ${TM}`, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(69,162,158,0.07)" }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: TD, cursor: "pointer", letterSpacing: -0.3 }} onClick={() => { onNav("home"); setMenuOpen(false); }}>
          Interview<span style={{ color: T }}>AI</span> <span style={{ color: GREY, fontSize: 11, fontWeight: 500 }}>for IT</span>
        </div>
        {/* Desktop nav */}
        <div className="hide-mobile" style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {[["home","Home"],["select","Practice"],["resume","Resume Check"],["resources","Job Sites"]].map(([id,label]) => (
            <button key={id} onClick={() => onNav(id)} style={{ background: active === id ? TL : "transparent", color: active === id ? TD : GREY, border: active === id ? `1.5px solid ${TM}` : "1.5px solid transparent", borderRadius: 30, padding: "8px 18px", fontWeight: active === id ? 700 : 500, fontSize: 14, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
              {label}
            </button>
          ))}
          {user ? (
            <ProfileDropdown user={user} onNav={onNav} onLogout={onLogout} active={active} />
          ) : (
            <button onClick={() => onNav("login")} style={{ background: T, color: "white", border: "none", borderRadius: 30, padding: "8px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", marginLeft: 8 }}>
              Sign In
            </button>
          )}
        </div>
        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, fontSize: 20, display: "none" }} className="show-mobile">
          {menuOpen ? "✕" : "☰"}
        </button>
        <div style={{ display: menuOpen ? "block" : "none", position: "absolute", top: 64, left: 0, right: 0, background: "white", borderBottom: `1.5px solid ${TM}`, padding: "12px 5%", zIndex: 99 }}>
          {[["home","Home"],["select","Practice"],["resume","Resume Check"],["resources","Job Sites"],["profile", user ? "👤 Profile" : "Sign In"]].map(([id,label]) => (
            <div key={id} onClick={() => { onNav(id === "profile" && !user ? "login" : id); setMenuOpen(false); }} style={{ padding: "14px 0", fontWeight: active === id ? 700 : 500, color: active === id ? T : DARK, borderBottom: `1px solid ${TM}`, cursor: "pointer", fontSize: 16 }}>{label}</div>
          ))}
          {user && <div onClick={() => { onLogout(); setMenuOpen(false); }} style={{ padding: "14px 0", color: "#ef4444", cursor: "pointer", fontSize: 16 }}>Sign Out</div>}
        </div>
      </nav>
      {children}
      <footer style={{ background: DARK, color: TM, textAlign: "center", padding: "32px 5%", fontSize: 12 }}>
        <p style={{ margin: 0, fontWeight: 600 }}>InterviewAI for IT — Powered by Claude AI — Open Source on GitHub</p>
        <p style={{ margin: "6px 0 0", opacity: 0.5 }}>Free forever · No account required · Voice-first</p>
      </footer>
    </div>
  );
}

// ── AUTH PAGE ─────────────────────────────────────────────────────────────────
function AuthPage({ onSuccess }) {
  const [isLogin, setIsLogin]   = useState(true);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [message, setMessage]   = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError("");
    setMessage("");
    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else onSuccess(data.user);
    } else {
      if (!username.trim()) { setError("Please enter a username."); setLoading(false); return; }
      if (username.length < 3) { setError("Username must be at least 3 characters."); setLoading(false); return; }
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      if (data.user) {
        await supabase.from("profiles").insert({ id: data.user.id, username: username.trim().toLowerCase() });
      }
      setMessage("Check your email to confirm your account, then sign in.");
    }
    setLoading(false);
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: "0 5%" }}>
      <div style={{ ...styles.card, padding: 36 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🤖</div>
          <h2 style={{ ...styles.h2, fontSize: 22, margin: "0 0 6px" }}>{isLogin ? "Welcome back" : "Create account"}</h2>
          <p style={{ color: GREY, fontSize: 14, margin: 0 }}>
            {isLogin ? "Sign in to see your interview history" : "Save your results and track progress"}
          </p>
        </div>

        <button onClick={handleGoogle}
          style={{ width: "100%", padding: "12px", borderRadius: 30, border: `1.5px solid ${TM}`, background: "white", color: DARK, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: TM }} />
          <span style={{ color: GREY, fontSize: 12 }}>or</span>
          <div style={{ flex: 1, height: 1, background: TM }} />
        </div>

        {!isLogin && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontWeight: 600, fontSize: 13, color: DARK, display: "block", marginBottom: 6 }}>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="your_username"
              style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${TM}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            <div style={{ fontSize: 11, color: GREY, marginTop: 4 }}>Min 3 characters, lowercase. Shown on leaderboard.</div>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontWeight: 600, fontSize: 13, color: DARK, display: "block", marginBottom: 6 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${TM}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: 600, fontSize: 13, color: DARK, display: "block", marginBottom: 6 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${TM}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>

        {error   && <div style={{ background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 10, padding: 12, color: "#b91c1c", fontSize: 13, marginBottom: 14 }}>{error}</div>}
        {message && <div style={{ background: TL, border: `1px solid ${TM}`, borderRadius: 10, padding: 12, color: TD, fontSize: 13, marginBottom: 14 }}>{message}</div>}

        <button className="btn-hover" onClick={handleSubmit} disabled={loading}
          style={{ ...styles.bigBtn, width: "100%", justifyContent: "center", opacity: loading ? 0.6 : 1 }}>
          {loading ? "..." : isLogin ? "Sign In" : "Create Account"}
        </button>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: GREY }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => { setIsLogin(!isLogin); setError(""); setMessage(""); }}
            style={{ color: T, fontWeight: 700, cursor: "pointer" }}>
            {isLogin ? "Sign Up" : "Sign In"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ── PROFILE PAGE ──────────────────────────────────────────────────────────────
function ProfilePage({ user, onLogin, onDeleted }) {
  const [results, setResults]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState(null);
  const [username, setUsername]   = useState("");
  const [editingName, setEditingName] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [saveMsg, setSaveMsg]     = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]   = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("interview_results").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("username").eq("id", user.id).single()
    ]).then(([{ data: results }, { data: profile }]) => {
      setResults(results || []);
      setUsername(profile?.username || "");
      setLoading(false);
    });
  }, [user]);

  async function saveUsername() {
    if (newUsername.trim().length < 3) { setSaveMsg("Min 3 characters."); return; }
    const { error } = await supabase.from("profiles")
      .upsert({ id: user.id, username: newUsername.trim().toLowerCase() });
    if (error) setSaveMsg(error.message);
    else { setUsername(newUsername.trim().toLowerCase()); setEditingName(false); setSaveMsg("Saved!"); setTimeout(() => setSaveMsg(""), 2000); }
  }

  async function deleteAccount() {
    setDeleting(true);
    await supabase.from("interview_results").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.signOut();
    onDeleted();
  }

  if (!user) return (
    <div style={{ maxWidth: 500, margin: "80px auto", padding: "0 5%", textAlign: "center" }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>🔒</div>
      <h2 style={{ ...styles.h2, marginBottom: 8 }}>Sign in to see your profile</h2>
      <p style={{ color: GREY, marginBottom: 24 }}>Your interview history is saved to your account.</p>
      <button className="btn-hover" style={styles.bigBtn} onClick={onLogin}>Sign In</button>
    </div>
  );

  const avgScore = results.filter(r => r.score).length
    ? Math.round(results.filter(r => r.score).reduce((a, b) => a + (b.score || 0), 0) / results.filter(r => r.score).length)
    : null;
  const modeColors = { Friendly: "#22c55e", Normal: T, Tough: "#ef4444" };
  const displayName = username || user.email?.split("@")[0];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "52px 5%" }}>
      <div style={styles.chip}>My Profile</div>

      {/* User info card */}
      <div style={{ ...styles.card, marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", marginBottom: username || editingName ? 20 : 0 }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: `linear-gradient(135deg, ${T}, ${TD})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 24, fontWeight: 800, flexShrink: 0 }}>
            {displayName?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: DARK }}>{displayName}</div>
              {!editingName && <span onClick={() => { setNewUsername(username); setEditingName(true); }} style={{ fontSize: 12, color: T, fontWeight: 600, cursor: "pointer", background: TL, padding: "2px 10px", borderRadius: 20 }}>Edit username</span>}
            </div>
            <div style={{ color: GREY, fontSize: 13, marginTop: 2 }}>{user.email}</div>
            <div style={{ color: GREY, fontSize: 12, marginTop: 2 }}>Member since {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: T }}>{results.length}</div>
              <div style={{ fontSize: 12, color: GREY }}>Interviews</div>
            </div>
            {avgScore && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: T }}>{avgScore}<span style={{ fontSize: 14, color: GREY }}>/10</span></div>
                <div style={{ fontSize: 12, color: GREY }}>Avg Score</div>
              </div>
            )}
          </div>
        </div>

        {/* Edit username */}
        {editingName && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", paddingTop: 16, borderTop: `1px solid ${TM}` }}>
            <input value={newUsername} onChange={e => setNewUsername(e.target.value)}
              placeholder="new_username"
              style={{ flex: 1, minWidth: 160, padding: "9px 14px", borderRadius: 12, border: `1.5px solid ${TM}`, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
            <button className="btn-hover" style={{ ...styles.bigBtn, padding: "9px 20px", fontSize: 13 }} onClick={saveUsername}>Save</button>
            <button onClick={() => setEditingName(false)} style={{ padding: "9px 16px", borderRadius: 30, border: `1.5px solid ${TM}`, background: "white", color: GREY, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            {saveMsg && <span style={{ fontSize: 13, color: TD }}>{saveMsg}</span>}
          </div>
        )}
      </div>

      {/* Interview history */}
      <h3 style={{ fontWeight: 700, fontSize: 18, color: DARK, marginBottom: 16 }}>Interview History</h3>
      {loading && <div style={{ textAlign: "center", padding: 40, color: GREY }}>Loading...</div>}
      {!loading && results.length === 0 && (
        <div style={{ ...styles.card, textAlign: "center", padding: 48, marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎤</div>
          <p style={{ color: GREY, fontSize: 15 }}>No interviews yet. Complete your first one to see results here!</p>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 }}>
        {results.map((r, i) => (
          <div key={r.id} className="card-hover" style={{ ...styles.card, cursor: "pointer", transition: "all .2s" }}
            onClick={() => setExpanded(expanded === i ? null : i)}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: DARK, fontSize: 15 }}>{r.level} {r.role}</div>
                <div style={{ color: GREY, fontSize: 13, marginTop: 2 }}>
                  {new Date(r.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })} · {r.duration}min · {r.answers_count} answers
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ ...styles.tag, background: `${modeColors[r.mode] || T}22`, color: modeColors[r.mode] || T }}>{r.mode}</span>
                {r.score && (
                  <div style={{ fontWeight: 800, fontSize: 20, color: r.score >= 7 ? "#22c55e" : r.score >= 5 ? "#f59e0b" : "#ef4444" }}>
                    {r.score}<span style={{ fontSize: 13, color: GREY, fontWeight: 400 }}>/10</span>
                  </div>
                )}
                <span style={{ color: GREY, fontSize: 16 }}>{expanded === i ? "▲" : "▼"}</span>
              </div>
            </div>
            {expanded === i && r.verdict && (
              <div style={{ marginTop: 16, padding: "14px 16px", background: TL, borderRadius: 12, fontSize: 14, color: DARK, lineHeight: 1.6, borderLeft: `3px solid ${T}` }}>
                <strong>Verdict:</strong> {r.verdict}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div style={{ ...styles.card, border: "1.5px solid #fca5a5" }}>
        <h4 style={{ fontWeight: 700, fontSize: 15, color: "#b91c1c", marginBottom: 8 }}>⚠️ Danger Zone</h4>
        <p style={{ color: GREY, fontSize: 13, marginBottom: 16 }}>Deleting your account will permanently remove all your interview history and profile data. This cannot be undone.</p>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}
            style={{ padding: "10px 20px", borderRadius: 30, border: "1.5px solid #fca5a5", background: "white", color: "#b91c1c", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Delete Account
          </button>
        ) : (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#b91c1c", fontWeight: 600 }}>Are you sure? This cannot be undone.</span>
            <button onClick={deleteAccount} disabled={deleting}
              style={{ padding: "10px 20px", borderRadius: 30, border: "none", background: "#ef4444", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              {deleting ? "Deleting..." : "Yes, Delete Everything"}
            </button>
            <button onClick={() => setConfirmDelete(false)}
              style={{ padding: "10px 16px", borderRadius: 30, border: `1.5px solid ${TM}`, background: "white", color: GREY, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ResumePage() {
  const [file, setFile]             = useState(null);
  const [targetRole, setTargetRole] = useState("QA Engineer");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState("");
  const [dragging, setDragging]     = useState(false);
  const [extracting, setExtracting] = useState(false);
  const fileRef = useRef();

  // Load PDF.js and Mammoth from CDN once
  useEffect(() => {
    if (!window.pdfjsLib) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      };
      document.head.appendChild(script);
    }
    if (!window.mammoth) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
      document.head.appendChild(script);
    }
  }, []);

  async function extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target.result);
          const pdf = await window.pdfjsLib.getDocument({ data: typedArray }).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map(item => item.str).join(" ") + "\n";
          }
          resolve(fullText);
        } catch (err) { reject(err); }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  async function extractTextFromDOCX(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = await window.mammoth.extractRawText({ arrayBuffer: e.target.result });
          resolve(result.value);
        } catch (err) { reject(err); }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  async function analyzeResume() {
    if (!file) return;
    setError("");
    setResult(null);

    const isPDF  = file.type === "application/pdf";
    const isDOCX = file.name.endsWith(".docx");

    if (isPDF && !window.pdfjsLib) { setError("PDF reader is still loading, please wait a moment and try again."); return; }
    if (isDOCX && !window.mammoth) { setError("DOCX reader is still loading, please wait a moment and try again."); return; }

    setExtracting(true);
    let resumeText = "";
    try {
      if (isPDF)       resumeText = await extractTextFromPDF(file);
      else if (isDOCX) resumeText = await extractTextFromDOCX(file);
      else { setExtracting(false); setError("Please upload a PDF or DOCX file."); return; }
    } catch {
      setExtracting(false);
      setError("Could not read file. Make sure it's a valid PDF or DOCX.");
      return;
    }
    setExtracting(false);

    if (!resumeText.trim()) { setError("Could not extract text. Make sure your file is not a scanned image."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: resumeText, role: targetRole }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(parseResumeFeedback(data.feedback));
    } catch {
      setError("Could not connect to server. Please try again.");
    }
    setLoading(false);
  }
    const get = (key, next) => {
      const re = new RegExp(`${key}[:\\s]+([\\s\\S]*?)(?=${next}|$)`, "i");
      const m = text.match(re);
      return m ? m[1].trim() : "";
    };
    return {
      score:    text.match(/OVERALL_SCORE[:\s]+(\d+)/i)?.[1] || "",
      ats:      text.match(/ATS_SCORE[:\s]+(\d+)/i)?.[1] || "",
      summary:  get("SUMMARY",      "STRENGTHS|IMPROVEMENTS|ATS_SCORE|MISSING|VERDICT"),
      strengths:get("STRENGTHS",    "IMPROVEMENTS|ATS_SCORE|MISSING|VERDICT"),
      improve:  get("IMPROVEMENTS", "ATS_SCORE|MISSING|VERDICT"),
      ats_tips: get("ATS_TIPS",     "MISSING|VERDICT"),
      missing:  get("MISSING",      "VERDICT"),
      verdict:  get("VERDICT",      "ZZZEND"),
    };
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf" || f?.name.endsWith(".docx")) { setFile(f); setError(""); setResult(null); }
    else setError("Please upload a PDF or DOCX file.");
  }

  const fb = result;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "52px 5%" }}>
      <div style={styles.chip}>AI Resume Review</div>
      <h2 style={{ ...styles.h2, marginBottom: 6 }}>Check Your Resume</h2>
      <p style={{ color: GREY, marginBottom: 36, fontSize: 15 }}>Upload your PDF resume and get instant AI feedback tailored to your target role.</p>

      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => fileRef.current.click()}
        style={{ ...styles.card, border: `2px dashed ${dragging ? T : file ? T : TM}`, background: dragging ? TL : file ? TL : "white", cursor: "pointer", textAlign: "center", padding: "40px 24px", transition: "all .2s" }}>
        <input ref={fileRef} type="file" accept=".pdf,.docx" style={{ display: "none" }}
          onChange={e => { const f = e.target.files[0]; if (f) { setFile(f); setError(""); setResult(null); } }} />
        <div style={{ fontSize: 48, marginBottom: 12 }}>{file ? "📄" : "⬆️"}</div>
        {file ? (
          <>
            <div style={{ fontWeight: 700, color: DARK, fontSize: 15, marginBottom: 4 }}>{file.name}</div>
            <div style={{ color: GREY, fontSize: 13 }}>{(file.size / 1024).toFixed(0)} KB · Click to change</div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 700, color: DARK, fontSize: 15, marginBottom: 4 }}>Drop your resume here or click to upload</div>
            <div style={{ color: GREY, fontSize: 13 }}>PDF or DOCX · Max 5MB</div>
          </>
        )}
      </div>

      {/* Target role */}
      <div style={{ marginTop: 20 }}>
        <label style={{ fontWeight: 700, fontSize: 14, color: DARK, display: "block", marginBottom: 8 }}>Target Role</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["QA Engineer","Frontend Developer","Backend Developer","DevOps / SRE","Product Manager","Data Engineer / ML","Full Stack Developer","iOS Developer","Android Developer"].map(r => (
            <button key={r} onClick={() => setTargetRole(r)}
              style={{ padding: "8px 16px", borderRadius: 30, border: `1.5px solid ${targetRole === r ? T : TM}`, background: targetRole === r ? TL : "white", color: targetRole === r ? TD : GREY, fontWeight: targetRole === r ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 16, background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 12, padding: 14, color: "#b91c1c", fontSize: 14 }}>
          {error}
        </div>
      )}

      <button className="btn-hover"
        style={{ ...styles.bigBtn, marginTop: 24, opacity: file ? 1 : 0.45 }}
        disabled={!file || loading || extracting}
        onClick={analyzeResume}>
        {extracting ? "Reading PDF..." : loading ? "Analyzing..." : "🔍 Analyze Resume"}
      </button>

      {(loading || extracting) && (
        <div style={{ ...styles.card, textAlign: "center", padding: 48, marginTop: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12, animation: "float 2s ease-in-out infinite" }}>🤖</div>
          <p style={{ color: TD, fontWeight: 700, fontSize: 15 }}>
            {extracting ? "Reading your PDF..." : "Analyzing your resume..."}
          </p>
          <Waveform active={true} color={T} />
        </div>
      )}

      {/* Results */}
      {fb && (
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn .5s ease" }}>
          <div style={{ ...styles.card, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: T, lineHeight: 1 }}>{fb.score}<span style={{ fontSize: 18, color: GREY }}>/10</span></div>
              <div style={{ color: GREY, fontSize: 13, marginTop: 4 }}>Overall Score</div>
            </div>
            <div style={{ width: 1, background: TM }} />
            <div style={{ flex: 1, textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: TD, lineHeight: 1 }}>{fb.ats}<span style={{ fontSize: 18, color: GREY }}>/10</span></div>
              <div style={{ color: GREY, fontSize: 13, marginTop: 4 }}>ATS Score</div>
            </div>
          </div>
          {fb.summary    && <FBCard icon="📋" title="Summary"           text={fb.summary}   color={T}       />}
          {fb.strengths  && <FBCard icon="💪" title="Strengths"         text={fb.strengths} color="#22c55e" />}
          {fb.improve    && <FBCard icon="🔧" title="Improvements"      text={fb.improve}   color="#f59e0b" />}
          {fb.ats_tips   && <FBCard icon="🤖" title="ATS Optimization"  text={fb.ats_tips}  color={TD}      />}
          {fb.missing    && <FBCard icon="⚠️"  title="Missing Sections"  text={fb.missing}   color="#ef4444" />}
          {fb.verdict    && <FBCard icon="🏁" title="Next Steps"        text={fb.verdict}   color={T}       />}
          <button className="btn-hover" style={{ ...styles.bigBtn, alignSelf: "flex-start" }}
            onClick={() => { setFile(null); setResult(null); }}>
            Check Another Resume
          </button>
        </div>
      )}
    </div>
  );
}

function FBCard({ icon, title, text, color }) {
  return (
    <div style={{ background: "white", border: `1.5px solid ${TM}`, borderLeft: `4px solid ${color}`, borderRadius: 20, padding: 22 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: DARK, marginBottom: 10 }}>{icon} {title}</div>
      <div style={{ fontSize: 14, lineHeight: 1.75, color: GREY, whiteSpace: "pre-line" }}>{text}</div>
    </div>
  );
}

function CtaBanner({ onStart }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${DARK}, #0f3030)`, padding: "60px 5%", textAlign: "center" }}>
      <h2 style={{ color: "white", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, marginBottom: 10 }}>Ready to practice?</h2>
      <p style={{ color: TM, marginBottom: 28, fontSize: 15 }}>20-minute voice session. Real AI questions. Real feedback.</p>
      <button className="btn-hover" style={styles.bigBtn} onClick={onStart}>🎤 Start Voice Interview</button>
    </div>
  );
}

// ── SHARED STYLES ─────────────────────────────────────────────────────────────
const styles = {
  chip:   { display: "inline-block", background: TL, color: TD, borderRadius: 30, padding: "5px 16px", fontSize: 11.5, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 },
  h1:     { fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 800, lineHeight: 1.15, color: DARK, margin: "0 0 14px" },
  h2:     { fontSize: "clamp(1.5rem,3vw,2.2rem)", fontWeight: 800, color: DARK, margin: "0 0 24px" },
  sub:    { fontSize: 17, color: GREY, maxWidth: 540, margin: "0 auto 36px", lineHeight: 1.65 },
  row:    { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" },
  bigBtn: { background: T, color: "white", border: "none", borderRadius: 30, padding: "14px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: `0 4px 20px ${T}44`, fontFamily: "inherit", transition: "all .2s", display: "inline-flex", alignItems: "center", gap: 8 },
  card:   { background: "white", borderRadius: 20, padding: 22, border: `1.5px solid ${TM}`, boxShadow: "0 2px 16px rgba(69,162,158,0.08)" },
  grid3:  { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16 },
  tag:    { background: TL, color: TD, borderRadius: 30, padding: "4px 12px", fontSize: 11, fontWeight: 700 },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap');
  @keyframes fadeIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes wave    { 0%,100%{height:6px} 50%{height:26px} }
  @keyframes blobspin{ from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  * { box-sizing:border-box; }
  body { margin:0; }
  .btn-hover:hover { transform:translateY(-2px); box-shadow:0 8px 28px ${T}66 !important; }
  .card-hover:hover { border-color:${T} !important; transform:translateY(-3px); box-shadow:0 8px 24px ${T}22 !important; }
  @media(max-width:640px){
    .hide-mobile{ display:none !important; }
    .mobile-col{ flex-direction:column !important; }
    .mobile-full{ width:100% !important; }
    .mobile-pad{ padding:40px 20px !important; }
    .mobile-center{ text-align:center !important; }
    .grid-2col{ grid-template-columns:1fr 1fr !important; }
  }
`;