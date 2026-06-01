import { T, DARK, GREY, styles, JOB_SITES } from "../constants.js";
import Shell from "../components/Shell.jsx";
import CtaBanner from "../components/CtaBanner.jsx";

export default function ResourcesPage({ onNav, user, onLogout }) {
  return (
    <Shell active="resources" onNav={onNav} user={user} onLogout={onLogout}>
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
      <CtaBanner onStart={() => onNav("select")} />
    </Shell>
  );
}
