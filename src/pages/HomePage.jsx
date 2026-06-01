import { T, TD, TL, TM, DARK, GREY, BG, styles } from "../constants.js";
import Waveform from "../components/Waveform.jsx";
import CtaBanner from "../components/CtaBanner.jsx";
import Shell from "../components/Shell.jsx";

export default function HomePage({ onNav, user, onLogout }) {
  return (
    <Shell active="home" onNav={onNav} user={user} onLogout={onLogout}>
      {/* HERO */}
      <div style={{ background: `linear-gradient(160deg, ${TL} 0%, white 60%)`, padding: "60px 5% 0", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap" }}>
          {/* Left */}
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
              <button className="btn-hover" style={styles.bigBtn} onClick={() => onNav("select")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                Start Voice Interview
              </button>
              <button className="btn-hover" style={{ ...styles.bigBtn, background: "white", color: TD, border: `1.5px solid ${TM}`, boxShadow: "none" }} onClick={() => onNav("resources")}>
                View Job Sites →
              </button>
            </div>
          </div>

          {/* Right - Robot + chat preview */}
          <div style={{ flex: "1 1 320px", minWidth: 280, display: "flex", justifyContent: "center", alignItems: "flex-end", animation: "fadeIn .8s .2s both" }}>
            <div style={{ animation: "float 4s ease-in-out infinite", flexShrink: 0, marginRight: -16, zIndex: 2 }}>
              <img src="/robot-sitting.png" alt="AI Interviewer" style={{ width: 180, height: "auto", display: "block" }} />
            </div>
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
              ["/voice-first.png",         "Voice-First",        "Speak naturally, no typing. The AI listens, responds, and tracks the whole conversation."],
              ["/leaderboard.png",          "Leaderboard",        "Compete with other candidates. See who scores highest across roles and levels - updated in real time."],
              ["/ai-score.png",            "AI Score & Feedback", "Strengths, weaknesses, and actionable tips generated by AI after every session."],
              ["/6-profiles.png",          "6 IT Roles",         "QA, Frontend, Backend, DevOps, PM, Data Engineering - all covered with tailored questions."],
              ["/job-site-directory.png",  "Job Site Directory",  "17 curated remote-friendly job boards - from Wellfound to Levels.fyi."],
              ["/free-and-opensource.png", "Free & Open Source",  "No login, no paywall. Deploy on GitHub and Vercel in minutes."],
            ].map(([img, title, desc], i) => (
              <div key={i} className="card-hover" style={{ ...styles.card, transition: "all .2s", cursor: "default" }}>
                <img src={img} alt={title} style={{ width: 52, height: 52, objectFit: "contain", marginBottom: 14 }} />
                <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: DARK }}>{title}</h4>
                <p style={{ color: GREY, fontSize: 13.5, margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CtaBanner onStart={() => onNav("select")} />
    </Shell>
  );
}
