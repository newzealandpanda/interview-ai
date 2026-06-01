import { T, TD, TL, TM, DARK, GREY, styles } from "../constants.js";
import Shell from "../components/Shell.jsx";
import FBCard from "../components/FBCard.jsx";
import Waveform from "../components/Waveform.jsx";

export default function FeedbackPage({ onNav, user, onLogout, role, level, mode, transcript, loadingFB, feedbackRaw, fb, onPracticeAgain }) {
  return (
    <Shell active="" onNav={onNav} user={user} onLogout={onLogout}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "52px 5%" }}>
        <div style={styles.chip}>Session Complete</div>
        <h2 style={{ ...styles.h2, marginBottom: 6 }}>Your Interview Feedback</h2>
        <p style={{ color: GREY, marginBottom: 32 }}>
          Role: <strong style={{ color: DARK }}>{level?.label} {role?.label}</strong> · Mode: <strong style={{ color: mode?.color || T }}>{mode?.emoji} {mode?.label}</strong> · {transcript.filter(e => e.role === "user").length} answers recorded
        </p>

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
                <div style={{ fontSize: 60, fontWeight: 800, color: T, lineHeight: 1, flexShrink: 0 }}>
                  {fb.score}<span style={{ fontSize: 22, color: GREY }}>/10</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: DARK, marginBottom: 5 }}>Overall Score</div>
                  <div style={{ color: GREY, fontSize: 14 }}>
                    {parseInt(fb.score) >= 7 ? "You're interview-ready! 🚀" : parseInt(fb.score) >= 5 ? "Good progress, keep practicing." : "Room to grow - practice makes perfect."}
                  </div>
                </div>
              </div>
            )}
            {fb.verdict    && <FBCard icon="🏁" title="Verdict"           text={fb.verdict}    color={T}       />}
            {fb.strengths  && <FBCard icon="💪" title="Strengths"         text={fb.strengths}  color="#22c55e" />}
            {fb.weaknesses && <FBCard icon="🔧" title="Areas to Improve"  text={fb.weaknesses} color="#f59e0b" />}
            {fb.tips       && <FBCard icon="💡" title="Tips for Next Time" text={fb.tips}       color={TD}      />}
            {!fb.score && feedbackRaw && (
              <div style={{ ...styles.card, whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.7, color: GREY }}>{feedbackRaw}</div>
            )}
          </div>
        )}

        <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn-hover" style={styles.bigBtn} onClick={onPracticeAgain}>Practice Again</button>
          <button style={{ ...styles.bigBtn, background: "white", color: TD, border: `1.5px solid ${TM}`, boxShadow: "none" }} onClick={() => onNav("resources")}>View Job Sites →</button>
        </div>
      </div>
    </Shell>
  );
}
