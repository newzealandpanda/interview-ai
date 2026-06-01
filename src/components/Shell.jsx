import { useState } from "react";
import { T, TD, TL, TM, DARK, GREY, BG, CSS } from "../constants.js";
import ProfileDropdown from "./ProfileDropdown.jsx";

export default function Shell({ children, active, onNav, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: BG, minHeight: "100vh", color: DARK }}>
      <style>{CSS}</style>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5%", height: 64, background: "white", borderBottom: `1.5px solid ${TM}`, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(69,162,158,0.07)" }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: TD, cursor: "pointer", letterSpacing: -0.3 }} onClick={() => { onNav("home"); setMenuOpen(false); }}>
          Interview<span style={{ color: T }}>AI</span> <span style={{ color: GREY, fontSize: 11, fontWeight: 500 }}>for IT</span>
        </div>

        {/* Desktop nav */}
        <div className="hide-mobile" style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {[["home","Home"],["select","Practice"],["resume","Resume Check"],["resources","Job Sites"]].map(([id, label]) => (
            <button key={id} onClick={() => onNav(id)} style={{ background: active === id ? TL : "transparent", color: active === id ? TD : GREY, border: active === id ? `1.5px solid ${TM}` : "1.5px solid transparent", borderRadius: 30, padding: "8px 18px", fontWeight: active === id ? 700 : 500, fontSize: 14, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
              {label}
            </button>
          ))}
          {user ? (
            <ProfileDropdown user={user} onNav={onNav} onLogout={onLogout} active={active} />
          ) : (
            <button onClick={() => onNav("login")} style={{ background: T, color: "white", border: "none", borderRadius: 30, padding: "8px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", marginLeft: 8 }}>
              Sign In
            </button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, fontSize: 20, display: "none" }} className="show-mobile">
          {menuOpen ? "✕" : "☰"}
        </button>
        <div style={{ display: menuOpen ? "block" : "none", position: "absolute", top: 64, left: 0, right: 0, background: "white", borderBottom: `1.5px solid ${TM}`, padding: "12px 5%", zIndex: 99 }}>
          {[["home","Home"],["select","Practice"],["resume","Resume Check"],["resources","Job Sites"],["profile", user ? "👤 Profile" : "Sign In"]].map(([id, label]) => (
            <div key={id} onClick={() => { onNav(id === "profile" && !user ? "login" : id); setMenuOpen(false); }} style={{ padding: "14px 0", fontWeight: active === id ? 700 : 500, color: active === id ? T : DARK, borderBottom: `1px solid ${TM}`, cursor: "pointer", fontSize: 16 }}>
              {label}
            </div>
          ))}
          {user && (
            <div onClick={() => { onLogout(); setMenuOpen(false); }} style={{ padding: "14px 0", color: "#ef4444", cursor: "pointer", fontSize: 16 }}>
              Sign Out
            </div>
          )}
        </div>
      </nav>

      {children}

      <footer style={{ background: DARK, color: TM, textAlign: "center", padding: "32px 5%", fontSize: 12 }}>
        <p style={{ margin: 0, fontWeight: 600 }}>InterviewAI for IT - Powered by Claude AI - Open Source on GitHub</p>
        <p style={{ margin: "6px 0 0", opacity: 0.5 }}>Free forever · No account required · Voice-first</p>
      </footer>
    </div>
  );
}
