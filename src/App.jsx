import { useState, useEffect, useRef, useCallback } from "react";

// ── PALETTE ──────────────────────────────────────────────────────────────────
const T  = "#0abfbf";
const TD = "#089494";
const TL = "#e0f9f9";
const TM = "#a8ecec";
const DARK = "#0b1f1f";

// ── DATA ─────────────────────────────────────────────────────────────────────
const ROLES = [
  { id: "qa",       label: "QA Engineer",        emoji: "🧪" },
  { id: "frontend", label: "Frontend Developer",  emoji: "🎨" },
  { id: "backend",  label: "Backend Developer",   emoji: "⚙️" },
  { id: "devops",   label: "DevOps / SRE",        emoji: "🛠" },
  { id: "pm",       label: "Product Manager",     emoji: "📋" },
  { id: "data",     label: "Data Engineer / ML",  emoji: "🤖" },
];

const LEVELS = [
  { id: "junior",  label: "Junior",  emoji: "🌱", desc: "0-2 years, learning the basics" },
  { id: "middle",  label: "Middle",  emoji: "💼", desc: "2-5 years, works independently" },
  { id: "senior",  label: "Senior",  emoji: "⭐", desc: "5+ years, leads and mentors" },
  { id: "expert",  label: "Expert",  emoji: "🏆", desc: "10+ years, drives architecture" },
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
      <div style={{ textAlign: "center", padding: "80px 5% 60px", background: `linear-gradient(160deg, ${TL} 0%, white 55%, #f0fdfd 100%)` }}>
        <div style={styles.chip}>✦ AI Voice Interview Prep - IT Edition</div>
        <h1 style={styles.h1}>
          Practice interviews<br />
          <span style={{ color: T }}>by voice</span>, get hired faster
        </h1>
        <p style={styles.sub}>Real-time AI mock interviews for QA, Frontend, Backend, DevOps, PM and Data roles. Speak your answers and get instant feedback.</p>
        <div style={styles.row}>
          <button style={styles.bigBtn} onClick={() => setPage("select")}>🎤 Start Voice Interview</button>
          <button style={{ ...styles.bigBtn, background: "white", color: TD, border: `2px solid ${TM}`, boxShadow: "none" }} onClick={() => setPage("resources")}>View Job Sites →</button>
        </div>

        {/* preview card */}
        <div style={{ maxWidth: 660, margin: "52px auto 0", borderRadius: 20, overflow: "hidden", boxShadow: `0 24px 60px ${T}22`, border: `1px solid ${TM}` }}>
          <div style={{ background: DARK, padding: "10px 18px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57", display: "inline-block" }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e", display: "inline-block" }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: T, display: "inline-block" }} />
            <span style={{ color: TM, fontSize: 12, fontWeight: 600, marginLeft: 6 }}>Live Voice Session - QA Engineer</span>
            <span style={{ marginLeft: "auto", color: "#ff6b6b", fontSize: 12, fontWeight: 700 }}>● REC  18:42</span>
          </div>
          <div style={{ background: "white", padding: 24 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 18 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg,${T},${TD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🤖</div>
              <div style={{ background: TL, borderRadius: "0 12px 12px 12px", padding: "11px 15px", fontSize: 14, color: DARK, lineHeight: 1.5 }}>
                <em>How do you handle flaky tests in Playwright?</em>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", justifyContent: "flex-end" }}>
              <div style={{ background: "#f4fefe", border: `1px solid ${TM}`, borderRadius: "12px 0 12px 12px", padding: "11px 15px", fontSize: 14, color: "#334", lineHeight: 1.5, maxWidth: 380 }}>
                I usually add retry logic and use Playwright's built-in retry option…
              </div>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#e8f8f8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🧑</div>
            </div>
            <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
              <Waveform active={true} />
            </div>
          </div>
        </div>
      </div>

      {/* features */}
      <div style={{ padding: "64px 5%", background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ ...styles.h2, textAlign: "center", marginBottom: 36 }}>Everything in one place</h2>
          <div style={styles.grid3}>
            {[
              ["🎤","Voice-First","Speak naturally, no typing. The AI listens, responds, and tracks the conversation."],
              ["⏱","20-Min Sessions","Realistic time pressure. A countdown keeps you sharp, just like a real phone screen."],
              ["📊","AI Score & Feedback","Strengths, weaknesses, and actionable tips after every session."],
              ["🧪","6 IT Roles","QA, Frontend, Backend, DevOps, PM, Data Engineering - all covered."],
              ["🌐","Job Site Directory","17 curated remote-friendly job boards, from Wellfound to Levels.fyi."],
              ["🔓","Free & Open Source","No login. No paywall. Deploy it on GitHub + Vercel in minutes."],
            ].map(([icon, title, desc], i) => (
              <div key={i} style={{ ...styles.card, transition: "all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = TM; e.currentTarget.style.transform = ""; }}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>{icon}</div>
                <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: DARK }}>{title}</h4>
                <p style={{ color: "#4a7070", fontSize: 13.5, margin: 0, lineHeight: 1.6 }}>{desc}</p>
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
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "56px 5%" }}>

        {/* STEP 1 - ROLE */}
        <div style={styles.chip}>Step 1 of 2 - Choose your role</div>
        <h2 style={{ ...styles.h2, marginBottom: 6 }}>What role are you interviewing for?</h2>
        <p style={{ color: "#4a7070", marginBottom: 24, fontSize: 15 }}>Questions will be tailored to your specialization.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
          {ROLES.map(r => (
            <div key={r.id}
              onClick={() => setRole(r)}
              style={{ ...styles.card, cursor: "pointer", transition: "all .18s",
                borderColor: role?.id === r.id ? T : TM,
                background: role?.id === r.id ? TL : "white",
                transform: role?.id === r.id ? "scale(1.03)" : "" }}
              onMouseEnter={e => { if (role?.id !== r.id) { e.currentTarget.style.borderColor = TD; e.currentTarget.style.transform = "translateY(-2px)"; }}}
              onMouseLeave={e => { if (role?.id !== r.id) { e.currentTarget.style.borderColor = TM; e.currentTarget.style.transform = ""; }}}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{r.emoji}</div>
              <div style={{ fontWeight: 700, color: DARK }}>{r.label}</div>
            </div>
          ))}
        </div>

        {/* STEP 2 - LEVEL */}
        <div style={{ marginTop: 48 }}>
          <div style={styles.chip}>Step 2 of 2 - Choose your level</div>
          <h2 style={{ ...styles.h2, marginBottom: 6 }}>What is your experience level?</h2>
          <p style={{ color: "#4a7070", marginBottom: 24, fontSize: 15 }}>AI will adjust question complexity and scoring accordingly.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14 }}>
            {LEVELS.map(lv => (
              <div key={lv.id}
                onClick={() => setLevel(lv)}
                style={{ ...styles.card, cursor: "pointer", transition: "all .18s", textAlign: "center",
                  borderColor: level?.id === lv.id ? T : TM,
                  background: level?.id === lv.id ? TL : "white",
                  transform: level?.id === lv.id ? "scale(1.03)" : "" }}
                onMouseEnter={e => { if (level?.id !== lv.id) { e.currentTarget.style.borderColor = TD; e.currentTarget.style.transform = "translateY(-2px)"; }}}
                onMouseLeave={e => { if (level?.id !== lv.id) { e.currentTarget.style.borderColor = TM; e.currentTarget.style.transform = ""; }}}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{lv.emoji}</div>
                <div style={{ fontWeight: 700, color: DARK, marginBottom: 4 }}>{lv.label}</div>
                <div style={{ fontSize: 12, color: "#4a7070", lineHeight: 1.4 }}>{lv.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {micAllowed === false && (
          <div style={{ marginTop: 24, background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 10, padding: 16, color: "#b91c1c", fontSize: 14 }}>
            Microphone access was denied. Please allow microphone access in your browser settings and reload.
          </div>
        )}

        <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
          <button style={{ ...styles.bigBtn, opacity: (role && level) ? 1 : 0.45 }} disabled={!role || !level} onClick={startSession}>
            🎤 Start Interview
          </button>
          <button style={{ ...styles.bigBtn, background: "white", color: TD, border: `2px solid ${TM}`, boxShadow: "none" }} onClick={() => setPage("home")}>Back</button>
        </div>
      </div>
    </Shell>
  );

  // ── INTERVIEW ─────────────────────────────────────────────────────────────
  if (page === "interview") return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: DARK, minHeight: "100vh", color: "white" }}>
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
        <p style={{ color: "#4a7070", marginBottom: 32 }}>Role: <strong>{level?.label} {role?.label}</strong> - {transcript.filter(e => e.role === "user").length} answers recorded</p>

        {loadingFB ? (
          <div style={{ ...styles.card, textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
            <p style={{ color: TD, fontWeight: 700 }}>Analyzing your interview…</p>
            <Waveform active={true} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn .5s ease" }}>
            {/* score */}
            {fb.score && (
              <div style={{ ...styles.card, display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ fontSize: 56, fontWeight: 800, color: T, lineHeight: 1 }}>{fb.score}<span style={{ fontSize: 20, color: "#4a7070" }}>/10</span></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: DARK, marginBottom: 4 }}>Overall Score</div>
                  <div style={{ color: "#4a7070", fontSize: 13 }}>{parseInt(fb.score) >= 7 ? "You're interview-ready 🚀" : parseInt(fb.score) >= 5 ? "Good progress, keep practicing" : "Room to grow - practice makes perfect"}</div>
                </div>
              </div>
            )}
            {fb.verdict && <FBCard icon="🏁" title="Verdict" text={fb.verdict} color={T} />}
            {fb.strengths && <FBCard icon="💪" title="Strengths" text={fb.strengths} color="#22c55e" />}
            {fb.weaknesses && <FBCard icon="🔧" title="Areas to Improve" text={fb.weaknesses} color="#f59e0b" />}
            {fb.tips && <FBCard icon="💡" title="Tips for Next Time" text={fb.tips} color={TD} />}
            {!fb.score && feedbackRaw && <div style={{ ...styles.card, whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.7, color: "#334" }}>{feedbackRaw}</div>}
          </div>
        )}

        <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button style={styles.bigBtn} onClick={() => { setPage("select"); setTranscript([]); setFeedbackRaw(""); setRole(null); setLevel(null); }}>Practice Again</button>
          <button style={{ ...styles.bigBtn, background: "white", color: TD, border: `2px solid ${TM}`, boxShadow: "none" }} onClick={() => setPage("resources")}>View Job Sites →</button>
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
        <p style={{ color: "#4a7070", marginBottom: 36, fontSize: 15 }}>Curated from community recommendations. Remote-first, tech-focused.</p>
        <div style={styles.grid3}>
          {JOB_SITES.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
              <div style={{ ...styles.card, cursor: "pointer", transition: "all .18s", animationDelay: `${i * 0.04}s`, animation: "fadeIn .4s ease both" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = TM; e.currentTarget.style.transform = ""; }}>
                <span style={{ ...styles.tag, marginBottom: 8, display: "inline-block" }}>{s.tag}</span>
                <h4 style={{ fontWeight: 700, fontSize: 15, color: DARK, margin: "4px 0 5px" }}>{s.name}</h4>
                <p style={{ color: "#4a7070", fontSize: 13, margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                <div style={{ marginTop: 10, fontSize: 12, color: T, fontWeight: 600 }}>{s.url.replace("https://", "")} ↗</div>
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
  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: "#f4fefe", minHeight: "100vh", color: "#0b1f1f" }}>
      <style>{CSS}</style>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5%", height: 62, background: "white", borderBottom: `1px solid ${TM}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: TD, cursor: "pointer" }} onClick={() => onNav("home")}>
          InterviewAI <span style={{ color: T, fontSize: 11, fontWeight: 500 }}>for IT</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["home","Home"],["select","Practice"],["resources","Job Sites"]].map(([id,label]) => (
            <button key={id} onClick={() => onNav(id)} style={{ background: active === id ? TL : "transparent", color: active === id ? TD : "#4a7070", border: active === id ? `1px solid ${TM}` : "1px solid transparent", borderRadius: 8, padding: "7px 15px", fontWeight: active === id ? 700 : 500, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit" }}>
              {label}
            </button>
          ))}
        </div>
      </nav>
      {children}
      <footer style={{ background: DARK, color: TM, textAlign: "center", padding: "28px 5%", fontSize: 12 }}>
        <p style={{ margin: 0 }}>InterviewAI for IT - Powered by Claude AI - Open Source on GitHub</p>
        <p style={{ margin: "5px 0 0", opacity: 0.5 }}>Free forever - No account required - Voice-first</p>
      </footer>
    </div>
  );
}

function FBCard({ icon, title, text, color }) {
  return (
    <div style={{ background: "white", border: `1px solid ${TM}`, borderLeft: `4px solid ${color}`, borderRadius: 14, padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#0b1f1f", marginBottom: 10 }}>{icon} {title}</div>
      <div style={{ fontSize: 14, lineHeight: 1.75, color: "#2a4a4a", whiteSpace: "pre-line" }}>{text}</div>
    </div>
  );
}

function CtaBanner({ onStart }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${DARK}, #0a3030)`, padding: "56px 5%", textAlign: "center" }}>
      <h2 style={{ color: "white", fontSize: 28, fontWeight: 800, marginBottom: 10 }}>Ready to practice?</h2>
      <p style={{ color: TM, marginBottom: 26, fontSize: 15 }}>20-minute voice session. Real questions. Real AI feedback.</p>
      <button style={styles.bigBtn} onClick={onStart}>🎤 Start Voice Interview →</button>
    </div>
  );
}

// ── SHARED STYLES ─────────────────────────────────────────────────────────────
const styles = {
  chip:   { display: "inline-block", background: TL, color: TD, borderRadius: 20, padding: "4px 14px", fontSize: 11.5, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 },
  h1:     { fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 800, lineHeight: 1.15, color: DARK, margin: "0 0 14px" },
  h2:     { fontSize: "clamp(1.5rem,3vw,2.2rem)", fontWeight: 800, color: DARK, margin: "0 0 24px" },
  sub:    { fontSize: 17, color: "#4a7070", maxWidth: 540, margin: "0 auto 36px", lineHeight: 1.65 },
  row:    { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" },
  bigBtn: { background: T, color: "white", border: "none", borderRadius: 11, padding: "13px 30px", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: `0 4px 20px ${T}44`, fontFamily: "inherit", transition: "all .2s" },
  card:   { background: "white", borderRadius: 14, padding: 22, border: `1px solid ${TM}`, boxShadow: "0 2px 12px rgba(0,180,180,0.07)" },
  grid3:  { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16 },
  tag:    { background: TL, color: TD, borderRadius: 7, padding: "3px 9px", fontSize: 11, fontWeight: 700 },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap');
  @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes wave   { 0%,100%{height:6px} 50%{height:26px} }
  * { box-sizing: border-box; }
  body { margin: 0; }
`;