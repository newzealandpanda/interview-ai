import { T, TD, TM, DARK, CSS, fmt } from "../constants.js";
import Waveform from "../components/Waveform.jsx";

export default function InterviewPage({ role, level, mode, duration, timeLeft, timerColor, pct, transcript, speaking, listening, statusMsg, onEnd }) {
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: DARK, minHeight: "100vh", color: "white" }}>
      <style>{CSS}</style>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5%", height: 60, borderBottom: "1px solid #1e3535" }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: T }}>
          InterviewAI <span style={{ color: TM, fontSize: 11, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
            - <img src={`/${mode?.id}.png`} alt={mode?.label} style={{ width: 18, height: 18, objectFit: "contain", verticalAlign: "middle" }} /> {mode?.label} · {level?.label} {role?.label} · {duration}min
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: timerColor, fontVariantNumeric: "tabular-nums", transition: "color 0.5s" }}>{fmt(timeLeft)}</div>
          <button onClick={onEnd} style={{ background: "#1e3535", color: "#ff6b6b", border: "1px solid #ff6b6b55", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>End Session</button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: "#1e3535" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${T},${TD})`, transition: "width 1s linear" }} />
      </div>

      {/* Transcript */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 5%", display: "flex", flexDirection: "column", gap: 14, minHeight: "calc(100vh - 180px)", overflowY: "auto" }}>
        {transcript.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", justifyContent: e.role === "user" ? "flex-end" : "flex-start", animation: "fadeIn .4s ease" }}>
            {e.role === "ai" && (
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${T},${TD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🤖</div>
            )}
            <div style={{ background: e.role === "ai" ? "#1a3535" : "#0a2828", border: `1px solid ${e.role === "ai" ? "#2a4545" : T + "44"}`, borderRadius: e.role === "ai" ? "0 12px 12px 12px" : "12px 0 12px 12px", padding: "11px 15px", fontSize: 14, lineHeight: 1.6, maxWidth: 520, color: e.role === "ai" ? TM : "white" }}>
              {e.text}
            </div>
            {e.role === "user" && (
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1a3535", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🧑</div>
            )}
          </div>
        ))}
      </div>

      {/* Status bar */}
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
}
