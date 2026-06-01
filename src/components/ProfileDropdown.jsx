import { useState, useEffect, useRef } from "react";
import { T, TD, TL, TM, DARK, GREY } from "../constants.js";

export default function ProfileDropdown({ user, onNav, onLogout, active }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", marginLeft: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: open || active === "profile" ? TL : T, color: open || active === "profile" ? TD : "white", border: `1.5px solid ${open || active === "profile" ? TM : T}`, borderRadius: 30, padding: "8px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, transition: "all .15s" }}>
        <span style={{ width: 22, height: 22, borderRadius: "50%", background: open || active === "profile" ? T : "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>
          {user.email?.[0]?.toUpperCase()}
        </span>
        Profile
        <span style={{ fontSize: 10, opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "white", borderRadius: 16, boxShadow: "0 8px 32px rgba(69,162,158,0.18)", border: `1.5px solid ${TM}`, minWidth: 200, zIndex: 200, overflow: "hidden", animation: "fadeIn .15s ease" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${TM}`, background: TL }}>
            <div style={{ fontSize: 12, color: GREY, marginBottom: 2 }}>Signed in as</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
          </div>
          <div onClick={() => { onNav("profile"); setOpen(false); }}
            style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: DARK, transition: "background .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = TL}
            onMouseLeave={e => e.currentTarget.style.background = "white"}>
            👤 My Profile
          </div>
          <div onClick={() => { onLogout(); setOpen(false); }}
            style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: "#ef4444", borderTop: `1px solid ${TM}`, transition: "background .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#fff0f0"}
            onMouseLeave={e => e.currentTarget.style.background = "white"}>
            🚪 Sign Out
          </div>
        </div>
      )}
    </div>
  );
}
