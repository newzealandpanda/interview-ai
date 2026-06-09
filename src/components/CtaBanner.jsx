import { styles, DARK, TM } from "../constants.js";

export default function CtaBanner({ onStart }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${DARK}, #0f3030)`, padding: "60px 5%", textAlign: "center" }}>
      <h2 style={{ color: "white", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, marginBottom: 10 }}>Ready to practice?</h2>
      <p style={{ color: TM, marginBottom: 28, fontSize: 15 }}>20-minute voice session. Real AI questions. Real feedback.</p>
      <button className="btn-hover" style={styles.bigBtn} onClick={onStart}>{<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>} Start Voice Interview</button>
    </div>
  );
}
