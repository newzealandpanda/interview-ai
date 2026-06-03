import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { T, TD, TL, TM, DARK, GREY, styles, JOB_SITES } from "../constants.js";
import Shell from "../components/Shell.jsx";
import CtaBanner from "../components/CtaBanner.jsx";

const ALL_TAGS = ["All", ...Array.from(new Set(JOB_SITES.flatMap(s => s.tags))).sort()];

export default function ResourcesPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeTag, setActiveTag] = useState("All");

  const filtered = activeTag === "All"
    ? JOB_SITES
    : JOB_SITES.filter(s => s.tags.includes(activeTag));

  return (
    <Shell user={user} onLogout={onLogout}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "52px 5%" }}>
        <div style={styles.chip}>Job Search</div>
        <h2 style={{ ...styles.h2, marginBottom: 6 }}>Best Job Sites for IT Professionals</h2>
        <p style={{ color: GREY, marginBottom: 28, fontSize: 15 }}>Curated from community recommendations. Remote-first, tech-focused.</p>

        {/* Tag filters */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          {ALL_TAGS.map(tag => (
            <button key={tag} onClick={() => setActiveTag(tag)}
              style={{ padding: "7px 16px", borderRadius: 30, border: `1.5px solid ${activeTag === tag ? T : TM}`, background: activeTag === tag ? TL : "white", color: activeTag === tag ? TD : GREY, fontWeight: activeTag === tag ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
              {tag}{tag !== "All" && <span style={{ opacity: 0.6, fontSize: 11, marginLeft: 4 }}>({JOB_SITES.filter(s => s.tags.includes(tag)).length})</span>}
            </button>
          ))}
        </div>

        <div style={{ color: GREY, fontSize: 13, marginBottom: 20 }}>
          Showing <strong style={{ color: DARK }}>{filtered.length}</strong> of {JOB_SITES.length} sites
        </div>

        <div style={styles.grid3}>
          {filtered.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
              <div className="card-hover" style={{ ...styles.card, cursor: "pointer", transition: "all .18s", height: "100%" }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {s.tags.map(tag => (
                    <span key={tag} style={{ ...styles.tag }}>{tag}</span>
                  ))}
                </div>
                <h4 style={{ fontWeight: 700, fontSize: 15, color: DARK, margin: "0 0 6px" }}>{s.name}</h4>
                <p style={{ color: GREY, fontSize: 13, margin: "0 0 12px", lineHeight: 1.5 }}>{s.desc}</p>
                <div style={{ fontSize: 12, color: T, fontWeight: 600 }}>{s.url.replace("https://", "")} ↗</div>
              </div>
            </a>
          ))}
        </div>
      </div>
      <CtaBanner onStart={() => navigate("/practice")} />
    </Shell>
  );
}
