import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase.js";
import { T, TD, TL, TM, DARK, GREY, styles, parseFeedback, MODES } from "../constants.js";
import Shell from "../components/Shell.jsx";
import FBCard from "../components/FBCard.jsx";
import Waveform from "../components/Waveform.jsx";

export default function FeedbackPage({ user, onLogout, role, level, mode, transcript, loadingFB, feedbackRaw, fb, onPracticeAgain }) {
  const navigate = useNavigate();
  const [restored, setRestored] = useState(null); // { role, level, mode, transcript, feedbackRaw, fb }
  const [restoring, setRestoring] = useState(false);

  const hasSession = role || feedbackRaw;

  useEffect(() => {
    if (hasSession || !user || loadingFB) return;
    setRestoring(true);
    supabase
      .from("interview_results")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (!data) { setRestoring(false); return; }
        const restoredTranscript = data.transcript ? JSON.parse(data.transcript) : [];
        const restoredFb = parseFeedback(data.feedback_raw || "");
        const restoredMode = MODES.find(m => m.label === data.mode) || null;
        setRestored({
          role: { label: data.role },
          level: { label: data.level },
          mode: restoredMode,
          transcript: restoredTranscript,
          feedbackRaw: data.feedback_raw || "",
          fb: restoredFb,
        });
        setRestoring(false);
      });
  }, [hasSession, user, loadingFB]);

  const activeRole      = role      || restored?.role;
  const activeLevel     = level     || restored?.level;
  const activeMode      = mode      || restored?.mode;
  const activeTranscript = (transcript?.length ? transcript : restored?.transcript) || [];
  const activeFeedbackRaw = feedbackRaw || restored?.feedbackRaw || "";
  const activeFb        = (fb?.score ? fb : restored?.fb) || {};

  if (restoring) return (
    <Shell user={user} onLogout={onLogout}>
      <div style={{ textAlign: "center", padding: 80, color: GREY }}>Loading your last session...</div>
    </Shell>
  );

  if (!hasSession && !restored) return (
    <Shell user={user} onLogout={onLogout}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "52px 5%", textAlign: "center" }}>
        <div style={{ ...styles.card, padding: 48 }}>
          <img src="/no-interviews-yet.png" alt="" style={{ width: 64, height: 64, objectFit: "contain", marginBottom: 16 }} />
          <h2 style={{ ...styles.h2, fontSize: 20, marginBottom: 8 }}>Session data was lost</h2>
          <p style={{ color: GREY, marginBottom: 24 }}>Please start a new interview to see your results here.</p>
          <button className="btn-hover" style={styles.bigBtn} onClick={() => navigate("/practice")}>Start Interview</button>
        </div>
      </div>
    </Shell>
  );

  return (
    <Shell user={user} onLogout={onLogout}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "52px 5%" }}>
        <div style={styles.chip}>Session Complete</div>
        <h2 style={{ ...styles.h2, marginBottom: 6 }}>Your Interview Feedback</h2>
        <p style={{ color: GREY, marginBottom: 32, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          Role: <strong style={{ color: DARK }}>{activeLevel?.label} {activeRole?.label}</strong>
          {activeMode && <>
            · Mode: <img src={`/${activeMode?.id}.png`} alt={activeMode?.label} style={{ width: 22, height: 22, objectFit: "contain", verticalAlign: "middle" }} />
            <strong style={{ color: activeMode?.color || T }}>{activeMode?.label}</strong>
          </>}
          · {activeTranscript.filter(e => e.role === "user").length} answers recorded
        </p>

        {loadingFB ? (
          <div style={{ ...styles.card, textAlign: "center", padding: 56 }}>
            <svg width="60" height="72" viewBox="0 0 130 160" fill="none" style={{ animation: "float 2s ease-in-out infinite", marginBottom: 16 }}>
              <rect x="35" y="22" width="60" height="54" rx="20" fill="white" stroke={T} strokeWidth="2"/>
              <circle cx="52" cy="42" r="7" fill={TL} stroke={T} strokeWidth="1.5"/>
              <circle cx="78" cy="42" r="7" fill={TL} stroke={T} strokeWidth="1.5"/>
              <circle cx="54" cy="43" r="3" fill={T}/><circle cx="80" cy="43" r="3" fill={T}/>
              <path d="M55 56 Q65 63 75 56" stroke={T} strokeWidth="2" strokeLinecap="round" fill="none"/>
            </svg>
            <p style={{ color: TD, fontWeight: 700, fontSize: 15 }}>Analyzing your interview...</p>
            <Waveform active={true} color={T} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn .5s ease" }}>
            {activeFb.score && (
              <div style={{ ...styles.card, display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ fontSize: 60, fontWeight: 800, color: T, lineHeight: 1, flexShrink: 0 }}>
                  {activeFb.score}<span style={{ fontSize: 22, color: GREY }}>/100</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: DARK, marginBottom: 5 }}>Overall Score</div>
                  <div style={{ color: GREY, fontSize: 14 }}>
                    {parseInt(activeFb.score) >= 70 ? "You're interview-ready! 🚀" : parseInt(activeFb.score) >= 50 ? "Good progress, keep practicing." : "Room to grow - practice makes perfect."}
                  </div>
                </div>
              </div>
            )}
            {activeFb.verdict    && <FBCard iconImg="/verdict.png"            title="Verdict"           text={activeFb.verdict}    color={T}       />}
            {activeFb.strengths  && <FBCard iconImg="/strengths.png"          title="Strengths"         text={activeFb.strengths}  color="#22c55e" />}
            {activeFb.weaknesses && <FBCard iconImg="/improve-areas.png"      title="Areas to Improve"  text={activeFb.weaknesses} color="#f59e0b" />}
            {activeFb.tips       && <FBCard iconImg="/typs-for-next-time.png" title="Tips for Next Time" text={activeFb.tips}       color={TD}      />}
            {!activeFb.score && activeFeedbackRaw && <div style={{ ...styles.card, whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.7, color: GREY }}>{activeFeedbackRaw}</div>}
          </div>
        )}

        <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn-hover" style={styles.bigBtn} onClick={onPracticeAgain}>Practice Again</button>
          <button style={{ ...styles.bigBtn, background: "white", color: TD, border: `1.5px solid ${TM}`, boxShadow: "none" }} onClick={() => navigate("/jobs")}>View Job Sites →</button>
        </div>
      </div>
    </Shell>
  );
}
