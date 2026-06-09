import { useNavigate } from "react-router-dom";
import { T, TD, TL, TM, DARK, GREY, styles, ROLES, LEVELS, MODES } from "../constants.js";
import Shell from "../components/Shell.jsx";

export default function SelectPage({ user, onLogout, role, setRole, level, setLevel, mode, setMode, duration, setDuration, micAllowed, onStart, jobDescription, setJobDescription }) {
  const navigate = useNavigate();

  function handleStart() {
    if (!user) {
      navigate("/login");
      return;
    }
    onStart();
  }

  return (
    <Shell user={user} onLogout={onLogout}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "52px 5%" }}>

        <div style={styles.chip}>Step 1 of 5</div>
        <h2 style={{ ...styles.h2, marginBottom: 6 }}>Choose Your Role</h2>
        <p style={{ color: GREY, marginBottom: 28, fontSize: 15 }}>Questions will be tailored to your specialization.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }} className="grid-2col">
          {ROLES.map(r => (
            <div key={r.id} onClick={() => setRole(r)}
              style={{ ...styles.card, cursor: "pointer", transition: "all .18s", display: "flex", alignItems: "center", gap: 14, borderColor: role?.id === r.id ? T : TM, background: role?.id === r.id ? TL : "white", borderWidth: role?.id === r.id ? 2 : 1.5 }}
              onMouseEnter={e => { if (role?.id !== r.id) { e.currentTarget.style.borderColor = T; e.currentTarget.style.transform = "translateY(-2px)"; }}}
              onMouseLeave={e => { if (role?.id !== r.id) { e.currentTarget.style.borderColor = TM; e.currentTarget.style.transform = ""; }}}>
              <img src={r.icon} alt={r.label} style={{ width: 44, height: 44, objectFit: "contain", flexShrink: 0 }} />
              <div style={{ fontWeight: 700, color: DARK, fontSize: 14 }}>{r.label}</div>
              {role?.id === r.id && <div style={{ marginLeft: "auto", color: T, fontSize: 16 }}>✓</div>}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 52 }}>
          <div style={styles.chip}>Step 2 of 5</div>
          <h2 style={{ ...styles.h2, marginBottom: 6 }}>Paste a Job Description <span style={{ fontSize: 14, fontWeight: 500, color: GREY }}>(optional)</span></h2>
          <p style={{ color: GREY, marginBottom: 16, fontSize: 15 }}>The AI will tailor questions to match this specific role. Skip to use general questions.</p>
          <div style={{ ...styles.card, padding: 0, overflow: "hidden" }}>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value.slice(0, 3000))}
              placeholder="Paste the job description here..."
              style={{ width: "100%", minHeight: 160, padding: "16px 20px", fontSize: 14, fontFamily: "inherit", border: "none", outline: "none", resize: "vertical", color: DARK, lineHeight: 1.6, boxSizing: "border-box", background: "transparent" }}
            />
            <div style={{ padding: "8px 20px", borderTop: `1px solid ${TM}`, fontSize: 12, color: GREY, textAlign: "right" }}>
              {jobDescription.length}/3000
              {jobDescription.length > 0 && (
                <span onClick={() => setJobDescription("")} style={{ marginLeft: 12, color: T, fontWeight: 600, cursor: "pointer" }}>Clear</span>
              )}
            </div>
          </div>
          {jobDescription.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 13, color: TD, fontWeight: 600 }}>
              ✓ Interview will be tailored to this job description
            </div>
          )}
        </div>

        <div style={{ marginTop: 52 }}>
          <div style={styles.chip}>Step 3 of 5</div>
          <h2 style={{ ...styles.h2, marginBottom: 6 }}>Choose Your Level</h2>
          <p style={{ color: GREY, marginBottom: 28, fontSize: 15 }}>AI adjusts question complexity and scoring to your experience.</p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {LEVELS.map(lv => (
              <div key={lv.id} onClick={() => setLevel(lv)}
                style={{ ...styles.card, cursor: "pointer", transition: "all .18s", textAlign: "center", flex: "1 1 130px", minWidth: 110, borderColor: level?.id === lv.id ? T : TM, background: level?.id === lv.id ? TL : "white", borderWidth: level?.id === lv.id ? 2 : 1.5 }}
                onMouseEnter={e => { if (level?.id !== lv.id) { e.currentTarget.style.borderColor = T; e.currentTarget.style.transform = "translateY(-2px)"; }}}
                onMouseLeave={e => { if (level?.id !== lv.id) { e.currentTarget.style.borderColor = TM; e.currentTarget.style.transform = ""; }}}>
                <img src={lv.icon} alt={lv.label} style={{ width: 44, height: 44, objectFit: "contain", margin: "0 auto 10px", display: "block" }} />
                <div style={{ fontWeight: 700, color: DARK, fontSize: 14, marginBottom: 3 }}>{lv.label}</div>
                <div style={{ fontSize: 11.5, color: GREY }}>{lv.desc}</div>
                {level?.id === lv.id && <div style={{ marginTop: 6, color: T, fontSize: 14, fontWeight: 700 }}>✓</div>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 52 }}>
          <div style={styles.chip}>Step 4 of 5</div>
          <h2 style={{ ...styles.h2, marginBottom: 6 }}>Choose Your Interviewer</h2>
          <p style={{ color: GREY, marginBottom: 28, fontSize: 15 }}>Each mode changes the tone, pressure, and feedback style.</p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {MODES.map(m => (
              <div key={m.id} onClick={() => setMode(m)}
                style={{ ...styles.card, cursor: "pointer", transition: "all .18s", flex: "1 1 180px", minWidth: 160, borderColor: mode?.id === m.id ? m.color : TM, background: mode?.id === m.id ? TL : "white", borderWidth: mode?.id === m.id ? 2 : 1.5 }}
                onMouseEnter={e => { if (mode?.id !== m.id) { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.transform = "translateY(-2px)"; }}}
                onMouseLeave={e => { if (mode?.id !== m.id) { e.currentTarget.style.borderColor = TM; e.currentTarget.style.transform = ""; }}}>
                <img src={`/${m.id}.png`} alt={m.label} style={{ width: 80, height: 80, objectFit: "contain", marginBottom: 10, display: "block" }} />
                <div style={{ fontWeight: 700, color: DARK, fontSize: 15, marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 13, color: GREY, lineHeight: 1.4 }}>{m.desc}</div>
                {mode?.id === m.id && <div style={{ marginTop: 8, color: m.color, fontSize: 13, fontWeight: 700 }}>Selected ✓</div>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 52 }}>
          <div style={styles.chip}>Step 5 of 5</div>
          <h2 style={{ ...styles.h2, marginBottom: 6 }}>Session Duration</h2>
          <p style={{ color: GREY, marginBottom: 28, fontSize: 15 }}>How long do you want your interview to be?</p>
          <div style={{ ...styles.card, padding: "28px 32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ color: GREY, fontSize: 14 }}>1 min</span>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: T }}>{duration}</span>
                <span style={{ fontSize: 16, color: GREY, fontWeight: 500 }}> min</span>
              </div>
              <span style={{ color: GREY, fontSize: 14 }}>60 min</span>
            </div>
            <input type="range" min={1} max={60} step={1} value={duration} onChange={e => setDuration(Number(e.target.value))} style={{ width: "100%", accentColor: T, height: 6, cursor: "pointer" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, gap: 8, flexWrap: "wrap" }}>
              {[5, 10, 15, 20, 30, 45, 60].map(d => (
                <button key={d} onClick={() => setDuration(d)} style={{ flex: "1 1 40px", padding: "7px 0", borderRadius: 30, border: `1.5px solid ${duration === d ? T : TM}`, background: duration === d ? TL : "white", color: duration === d ? TD : GREY, fontWeight: duration === d ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
                  {d}m
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end", gap: 12, marginTop: 24 }}>
          <div style={{ background: "white", border: `1.5px solid ${TM}`, borderRadius: "16px 16px 0 16px", padding: "10px 16px", fontSize: 13, color: DARK, fontWeight: 500, boxShadow: `0 4px 12px ${T}18` }}>
            {!role ? "Choose your role to begin." : !level ? "Great! Now pick your level." : !mode ? "Now choose your interviewer." : jobDescription ? "JD loaded - let's go! 🎯" : "You're all set - let's go! 🚀"}
          </div>
          <div style={{ flexShrink: 0, animation: "float 3s ease-in-out infinite" }}>
            <img src="/robot-standing.png" alt="Robot" style={{ width: 90, height: "auto" }} />
          </div>
        </div>

        {micAllowed === false && (
          <div style={{ marginTop: 20, background: "#fff0f0", border: "1.5px solid #fca5a5", borderRadius: 16, padding: 16, color: "#b91c1c", fontSize: 14 }}>
            Microphone access was denied. Please allow it in your browser settings and reload.
          </div>
        )}

        <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn-hover" style={{ ...styles.bigBtn, opacity: (role && level && mode) ? 1 : 0.45 }} disabled={!role || !level || !mode} onClick={handleStart}>
            {<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>} Start Interview
          </button>
          <button style={{ ...styles.bigBtn, background: "white", color: TD, border: `1.5px solid ${TM}`, boxShadow: "none" }} onClick={() => navigate("/")}>Back</button>
        </div>
      </div>
    </Shell>
  );
}
