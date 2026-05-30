import { useState, useEffect, useRef, useCallback } from "react";

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
  { id: "qa",       label: "QA Engineer",       emoji: "🧪" },
  { id: "frontend", label: "Frontend Developer", emoji: "💻" },
  { id: "backend",  label: "Backend Developer",  emoji: "⚙️" },
  { id: "devops",   label: "DevOps / SRE",       emoji: "🛠️" },
  { id: "pm",       label: "Product Manager",    emoji: "📋" },
  { id: "data",     label: "Data Engineer / ML", emoji: "📊" },
];

const LEVELS = [
  { id: "junior", label: "Junior", desc: "0-2 years", emoji: "🌱" },
  { id: "middle", label: "Middle", desc: "2-5 years", emoji: "💼" },
  { id: "senior", label: "Senior", desc: "5+ years",  emoji: "⭐" },
  { id: "expert", label: "Expert", desc: "10+ years", emoji: "🏆" },
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

const TOTAL_SEC = 20 * 60; // 20 minutes

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
  const [page, setPage]           = useState("home");   // home | select | interview | feedback | resources
  const [role, setRole]           = useState(null);
  const [level, setLevel]         = useState(null);
  const [qIndex, setQIndex]       = useState(0);
  const [timeLeft, setTimeLeft]   = useState(TOTAL_SEC);
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

    const system = `You are Alex, a sharp and experienced technical interviewer at a top tech company. You are interviewing a candidate for a ${level?.label} ${role?.label} position.

CRITICAL RULES:
1. You MUST read the candidate's last answer carefully and react to it specifically
2. If the answer was vague or missing details — dig deeper with a follow-up on THAT specific point
3. If the answer mentioned a technology, project, or experience — ask about it specifically
4. If the answer was strong — move to a new topic
5. Never ask generic template questions — every question must feel like a natural continuation of the conversation
6. One short question only — no preamble, no "Great answer!", no commentary
7. Questions asked so far: ${asked}. Time remaining: ${Math.floor(timeRemaining / 60)} min.
8. If questions asked < ${MIN_QUESTIONS} — always continue
9. If time < 3 min OR questions >= ${MAX_QUESTIONS} — output only: END_INTERVIEW
10. Output the question only — nothing else before or after`;

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
    setTimeLeft(TOTAL_SEC);
    setRunning(true);
    setPage("interview");

    // Seed the conversation so AI knows the context from the start
    conversationRef.current = [{
      role: "user",
      content: `[SYSTEM] This is the start of a mock interview. Role: ${level?.label} ${role?.label}. Please begin with "Tell me about yourself" or a similar opener.`
    }];

    const greeting = `Hi, I'm Alex, your interviewer today. We have 20 minutes. I'll be asking questions for a ${level?.label} ${role?.label} position. Feel free to take your time. Let's get started!`;
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
      const system = `You are a senior tech hiring manager giving feedback after a mock interview. Be honest, specific, and constructive. Calibrate scoring to the candidate's stated level.`;
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
      setFeedbackRaw(text || "OVERALL_SCORE: N/A\nVERDICT: Could not generate feedback. Please try again.");
    } catch {
      setFeedbackRaw("OVERALL_SCORE: N/A\nVERDICT: Could not connect to AI feedback service. Please check your connection.");
    }
    setLoadingFB(false);
  }

  const fb = parseFeedback(feedbackRaw);
  const pct = Math.round(((TOTAL_SEC - timeLeft) / TOTAL_SEC) * 100);
  const timerColor = timeLeft < 120 ? "#ff6b6b" : timeLeft < 300 ? "#f59e0b" : T;

  // ══════════════════════════════════════════════════════════════════════════
  // PAGES
  // ══════════════════════════════════════════════════════════════════════════

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (page === "home") return (
    <Shell active="home" onNav={setPage}>
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
            <div style={{ animation: "float 4s ease-in-out infinite", flexShrink: 0, marginRight: -16, zIndex: 2, width: 180, height: 220, position: "relative", overflow: "hidden", background: "transparent", mixBlendMode: "multiply" }}>
              <img
                src="/robots.png"
                alt="AI Interviewer Robot"
                style={{ position: "absolute", width: "200%", height: "auto", top: "0%", left: "0%", maxWidth: "none" }}
              />
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
              [`<svg viewBox="0 0 40 40" fill="none" stroke="${T}" stroke-width="1.8" stroke-linecap="round"><path d="M12 20 Q12 10 20 8 Q28 10 28 20"/><rect x="8" y="20" width="24" height="12" rx="6"/><line x1="20" y1="32" x2="20" y2="37"/><line x1="15" y1="37" x2="25" y2="37"/></svg>`, "Voice-First", "Speak naturally, no typing. The AI listens, responds, and tracks the whole conversation."],
              [`<svg viewBox="0 0 40 40" fill="none" stroke="${T}" stroke-width="1.8" stroke-linecap="round"><circle cx="20" cy="20" r="12"/><path d="M20 14 L20 20 L25 23"/></svg>`, "20-Min Sessions", "Realistic time pressure. A countdown keeps you sharp, just like a real phone screen."],
              [`<svg viewBox="0 0 40 40" fill="none" stroke="${T}" stroke-width="1.8" stroke-linecap="round"><rect x="8" y="12" width="24" height="18" rx="4"/><path d="M14 22 L18 26 L26 18"/></svg>`, "AI Score & Feedback", "Strengths, weaknesses, and actionable tips generated by AI after every session."],
              [`<svg viewBox="0 0 40 40" fill="none" stroke="${T}" stroke-width="1.8" stroke-linecap="round"><circle cx="14" cy="20" r="5"/><circle cx="26" cy="14" r="5"/><circle cx="26" cy="26" r="5"/><line x1="19" y1="18" x2="21" y2="15"/><line x1="19" y1="22" x2="21" y2="25"/></svg>`, "6 IT Roles", "QA, Frontend, Backend, DevOps, PM, Data Engineering — all covered with tailored questions."],
              [`<svg viewBox="0 0 40 40" fill="none" stroke="${T}" stroke-width="1.8" stroke-linecap="round"><circle cx="20" cy="20" r="12"/><path d="M8 20 Q14 14 20 20 Q26 26 32 20"/></svg>`, "Job Site Directory", "17 curated remote-friendly job boards — from Wellfound to Levels.fyi."],
              [`<svg viewBox="0 0 40 40" fill="none" stroke="${T}" stroke-width="1.8" stroke-linecap="round"><rect x="10" y="14" width="20" height="20" rx="4"/><path d="M15 14 L15 10 Q15 8 20 8 Q25 8 25 10 L25 14"/><circle cx="20" cy="24" r="3" fill="${TL}"/></svg>`, "Free & Open Source", "No login, no paywall. Deploy on GitHub and Vercel in minutes."],
            ].map(([icon, title, desc], i) => (
              <div key={i} className="card-hover" style={{ ...styles.card, transition: "all .2s", cursor: "default" }}>
                <div style={{ width: 44, height: 44, marginBottom: 14 }} dangerouslySetInnerHTML={{ __html: icon }} />
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
    <Shell active="select" onNav={setPage}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "52px 5%" }}>

        {/* STEP 1 - ROLE */}
        <div style={styles.chip}>Step 1 of 2</div>
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
              <div style={{ fontSize: 32, flexShrink: 0, width: 44, textAlign: "center" }}>{r.emoji}</div>
              <div style={{ fontWeight: 700, color: DARK, fontSize: 14 }}>{r.label}</div>
              {role?.id === r.id && <div style={{ marginLeft: "auto", color: T, fontSize: 16 }}>✓</div>}
            </div>
          ))}
        </div>

        {/* STEP 2 - LEVEL */}
        <div style={{ marginTop: 52 }}>
          <div style={styles.chip}>Step 2 of 2</div>
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
                <div style={{ fontSize: 32, margin: "0 auto 10px", textAlign: "center" }}>{lv.emoji}</div>
                <div style={{ fontWeight: 700, color: DARK, fontSize: 14, marginBottom: 3 }}>{lv.label}</div>
                <div style={{ fontSize: 11.5, color: GREY }}>{lv.desc}</div>
                {level?.id === lv.id && <div style={{ marginTop: 6, color: T, fontSize: 14, fontWeight: 700 }}>✓</div>}
              </div>
            ))}
          </div>

          {/* Robot helper */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end", gap: 12, marginTop: 24 }}>
            <div style={{ background: "white", border: `1.5px solid ${TM}`, borderRadius: "16px 16px 0 16px", padding: "10px 16px", fontSize: 13, color: DARK, fontWeight: 500, boxShadow: `0 4px 12px ${T}18` }}>
              {!role && !level ? "Pick a role and level to begin!" : !role ? "Now choose your role!" : !level ? "Great! Now pick your level." : "You're all set — let's go! 🚀"}
            </div>
            {/* Standing robot - right half of sprite */}
            <div style={{ width: 100, height: 120, overflow: "hidden", position: "relative", flexShrink: 0, animation: "float 3s ease-in-out infinite", mixBlendMode: "multiply" }}>
              <img
                src="/robots.png"
                alt="Robot"
                style={{ position: "absolute", height: "200%", width: "auto", top: "0%", right: "0%", maxWidth: "none" }}
              />
            </div>
          </div>
        </div>

        {micAllowed === false && (
          <div style={{ marginTop: 20, background: "#fff0f0", border: "1.5px solid #fca5a5", borderRadius: 16, padding: 16, color: "#b91c1c", fontSize: 14 }}>
            Microphone access was denied. Please allow it in your browser settings and reload.
          </div>
        )}

        <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn-hover" style={{ ...styles.bigBtn, opacity: (role && level) ? 1 : 0.45 }} disabled={!role || !level} onClick={startSession}>
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
        <div style={{ fontWeight: 800, fontSize: 16, color: T }}>InterviewAI <span style={{ color: TM, fontSize: 11, fontWeight: 500 }}>- {level?.label} {role?.label}</span></div>
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
        <div style={{ marginLeft: "auto", color: "#4a7070", fontSize: 12, whiteSpace: "nowrap" }}>Q {qIndex} · up to {MAX_QUESTIONS}</div>
      </div>
    </div>
  );

  // ── FEEDBACK ──────────────────────────────────────────────────────────────
  if (page === "feedback") return (
    <Shell active="" onNav={setPage}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "52px 5%" }}>
        <div style={styles.chip}>Session Complete</div>
        <h2 style={{ ...styles.h2, marginBottom: 6 }}>Your Interview Feedback</h2>
        <p style={{ color: GREY, marginBottom: 32 }}>Role: <strong style={{ color: DARK }}>{level?.label} {role?.label}</strong> — {transcript.filter(e => e.role === "user").length} answers recorded</p>

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
          <button className="btn-hover" style={styles.bigBtn} onClick={() => { setPage("select"); setTranscript([]); setFeedbackRaw(""); setRole(null); setLevel(null); }}>Practice Again</button>
          <button style={{ ...styles.bigBtn, background: "white", color: TD, border: `1.5px solid ${TM}`, boxShadow: "none" }} onClick={() => setPage("resources")}>View Job Sites →</button>
        </div>
      </div>
    </Shell>
  );

  // ── RESOURCES ─────────────────────────────────────────────────────────────
  if (page === "resources") return (
    <Shell active="resources" onNav={setPage}>
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
function Shell({ children, active, onNav }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: BG, minHeight: "100vh", color: DARK }}>
      <style>{CSS}</style>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5%", height: 64, background: "white", borderBottom: `1.5px solid ${TM}`, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(69,162,158,0.07)" }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: TD, cursor: "pointer", letterSpacing: -0.3 }} onClick={() => { onNav("home"); setMenuOpen(false); }}>
          Interview<span style={{ color: T }}>AI</span> <span style={{ color: GREY, fontSize: 11, fontWeight: 500 }}>for IT</span>
        </div>
        {/* Desktop nav */}
        <div className="hide-mobile" style={{ display: "flex", gap: 4 }}>
          {[["home","Home"],["select","Practice"],["resources","Job Sites"]].map(([id,label]) => (
            <button key={id} onClick={() => onNav(id)} style={{ background: active === id ? TL : "transparent", color: active === id ? TD : GREY, border: active === id ? `1.5px solid ${TM}` : "1.5px solid transparent", borderRadius: 30, padding: "8px 18px", fontWeight: active === id ? 700 : 500, fontSize: 14, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
              {label}
            </button>
          ))}
        </div>
        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(o => !o)} style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 8, fontSize: 20 }} className="mobile-full" style2={{ display: "block" }}>
          {menuOpen ? "✕" : "☰"}
        </button>
        <div style={{ display: menuOpen ? "block" : "none", position: "absolute", top: 64, left: 0, right: 0, background: "white", borderBottom: `1.5px solid ${TM}`, padding: "12px 5%", zIndex: 99 }}>
          {[["home","Home"],["select","Practice"],["resources","Job Sites"]].map(([id,label]) => (
            <div key={id} onClick={() => { onNav(id); setMenuOpen(false); }} style={{ padding: "14px 0", fontWeight: active === id ? 700 : 500, color: active === id ? T : DARK, borderBottom: `1px solid ${TM}`, cursor: "pointer", fontSize: 16 }}>{label}</div>
          ))}
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