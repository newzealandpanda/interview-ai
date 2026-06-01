import { T, TD, TL, TM, DARK, GREY, styles, ROLES, LEVELS, MODES } from "../constants.js";
import Shell from "../components/Shell.jsx";

export default function SelectPage({ onNav, user, onLogout, role, setRole, level, setLevel, mode, setMode, duration, setDuration, micAllowed, onStart }) {
  return (
    <Shell active="select" onNav={onNav} user={user} onLogout={onLogout}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "52px 5%" }}>

        {/* STEP 1 - ROLE */}
        <div style={styles.chip}>Step 1 of 4</div>
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

        {/* STEP 2 - LEVEL */}
        <div style={{ marginTop: 52 }}>
          <div style={styles.chip}>Step 2 of 4</div>
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

        {/* STEP 3 - MODE */}
        <div style={{ marginTop: 52 }}>
          <div style={styles.chip}>Step 3 of 4</div>
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

        {/* STEP 4 - DURATION */}
        <div style={{ marginTop: 52 }}>
          <div style={styles.chip}>Step 4 of 4</div>
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
            <input type="range" min={1} max={60} step={1} value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              style={{ width: "100%", accentColor: T, height: 6, cursor: "pointer" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, gap: 8, flexWrap: "wrap" }}>
              {[5, 10, 15, 20, 30, 45, 60].map(d => (
                <button key={d} onClick={() => setDuration(d)}
                  style={{ flex: "1 1 40px", padding: "7px 0", borderRadius: 30, border: `1.5px solid ${duration === d ? T : TM}`, background: duration === d ? TL : "white", color: duration === d ? TD : GREY, fontWeight: duration === d ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
                  {d}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Robot helper */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end", gap: 12, marginTop: 24 }}>
          <div style={{ background: "white", border: `1.5px solid ${TM}`, borderRadius: "16px 16px 0 16px", padding: "10px 16px", fontSize: 13, color: DARK, fontWeight: 500, boxShadow: `0 4px 12px ${T}18` }}>
            {!role ? "Choose your role to begin." : !level ? "Great! Now pick your level." : !mode ? "Now choose your interviewer." : "You're all set - let's go! 🚀"}
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
          <button className="btn-hover" style={{ ...styles.bigBtn, opacity: (role && level && mode) ? 1 : 0.45 }} disabled={!role || !level || !mode} onClick={onStart}>
            🎤 Start Interview
          </button>
          <button style={{ ...styles.bigBtn, background: "white", color: TD, border: `1.5px solid ${TM}`, boxShadow: "none" }} onClick={() => onNav("home")}>Back</button>
        </div>
      </div>
    </Shell>
  );
}
