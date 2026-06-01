import { styles, DARK, TM } from "../constants.js";

export default function CtaBanner({ onStart }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${DARK}, #0f3030)`, padding: "60px 5%", textAlign: "center" }}>
      <h2 style={{ color: "white", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, marginBottom: 10 }}>Ready to practice?</h2>
      <p style={{ color: TM, marginBottom: 28, fontSize: 15 }}>20-minute voice session. Real AI questions. Real feedback.</p>
      <button className="btn-hover" style={styles.bigBtn} onClick={onStart}>🎤 Start Voice Interview</button>
    </div>
  );
}
