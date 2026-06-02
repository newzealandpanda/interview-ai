import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase.js";
import { T, TD, TL, TM, DARK, GREY, styles } from "../constants.js";
import Shell from "../components/Shell.jsx";
import Avatar from "../components/Avatar.jsx";

export default function ProfilePage({ user, onLogout, onLogin, onDeleted, onAvatarChange }) {
  const navigate = useNavigate();
  const [results, setResults]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [expanded, setExpanded]       = useState(null);
  const [username, setUsername]       = useState("");
  const [avatarUrl, setAvatarUrl]     = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMsg, setAvatarMsg]     = useState("");
  const [editingName, setEditingName] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [saveMsg, setSaveMsg]         = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [newPwd, setNewPwd]           = useState("");
  const [confirmPwd, setConfirmPwd]   = useState("");
  const [pwdLoading, setPwdLoading]   = useState(false);
  const [pwdMsg, setPwdMsg]           = useState("");
  const [pwdError, setPwdError]       = useState("");
  const avatarRef = useRef();

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("interview_results").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("username, avatar_url").eq("id", user.id).single()
    ]).then(([{ data: res }, { data: profile }]) => {
      setResults(res || []);
      setUsername(profile?.username || "");
      setAvatarUrl(profile?.avatar_url || null);
      setLoading(false);
    });
  }, [user]);

  async function uploadAvatar(file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setAvatarMsg("File too large. Max 2MB."); return; }
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) { setAvatarMsg("Only JPG, PNG or WebP allowed."); return; }
    setAvatarLoading(true); setAvatarMsg("");
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setAvatarMsg(upErr.message); setAvatarLoading(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = data.publicUrl + "?t=" + Date.now(); // cache bust
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    setAvatarUrl(url);
    onAvatarChange?.(url);
    setAvatarMsg("Avatar updated!");
    setTimeout(() => setAvatarMsg(""), 2000);
    setAvatarLoading(false);
  }

  async function removeAvatar() {
    setAvatarLoading(true);
    await supabase.storage.from("avatars").remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`]);
    await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
    setAvatarUrl(null);
    onAvatarChange?.(null);
    setAvatarMsg("Avatar removed.");
    setTimeout(() => setAvatarMsg(""), 2000);
    setAvatarLoading(false);
  }

  if (!user) return (
    <Shell user={user} onLogout={onLogout}>
      <div style={{ maxWidth: 500, margin: "80px auto", padding: "0 5%", textAlign: "center" }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🔒</div>
        <h2 style={{ ...styles.h2, marginBottom: 8 }}>Sign in to see your profile</h2>
        <p style={{ color: GREY, marginBottom: 24 }}>Your interview history is saved to your account.</p>
        <button className="btn-hover" style={styles.bigBtn} onClick={() => navigate("/login")}>Sign In</button>
      </div>
    </Shell>
  );

  async function saveUsername() {
    if (newUsername.trim().length < 3) { setSaveMsg("Min 3 characters."); return; }
    const { error } = await supabase.from("profiles").upsert({ id: user.id, username: newUsername.trim().toLowerCase() });
    if (error) setSaveMsg(error.message);
    else { setUsername(newUsername.trim().toLowerCase()); setEditingName(false); setSaveMsg("Saved!"); setTimeout(() => setSaveMsg(""), 2000); }
  }

  function validatePassword(pwd) {
    if (
      pwd.length < 8 ||
      !/[A-Za-z]/.test(pwd) ||
      !/[0-9]/.test(pwd) ||
      !/[^A-Za-z0-9]/.test(pwd)
    ) return "Password must be at least 8 characters and include a letter, a number, and a special character.";
    return null;
  }

  async function changePassword() {
    setPwdError(""); setPwdMsg("");
    const err = validatePassword(newPwd);
    if (err) { setPwdError(err); return; }
    if (newPwd !== confirmPwd) { setPwdError("Passwords do not match."); return; }
    setPwdLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (error) setPwdError(error.message);
    else {
      setPwdMsg("Password updated successfully!");
      setNewPwd(""); setConfirmPwd("");
      setTimeout(() => { setPwdMsg(""); setChangingPwd(false); }, 2000);
    }
    setPwdLoading(false);
  }

  async function deleteAccount() {
    setDeleting(true);
    await supabase.from("interview_results").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.signOut();
    onDeleted();
  }

  const modeColors = { Friendly: "#22c55e", Normal: T, Tough: "#ef4444" };
  const avgScore = results.filter(r => r.score).length
    ? Math.round(results.filter(r => r.score).reduce((a, b) => a + (b.score || 0), 0) / results.filter(r => r.score).length)
    : null;
  const displayName = username || user.email?.split("@")[0];

  return (
    <Shell user={user} onLogout={onLogout}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "52px 5%" }}>
        <div style={styles.chip}>My Profile</div>

        <div style={{ ...styles.card, marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", marginBottom: editingName ? 20 : 0 }}>
            {/* Avatar with upload */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <input ref={avatarRef} type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: "none" }} onChange={e => uploadAvatar(e.target.files[0])} />
              <Avatar url={avatarUrl} name={displayName} size={68} />
              <button onClick={() => avatarRef.current.click()} disabled={avatarLoading}
                style={{ position: "absolute", bottom: -4, right: -4, width: 24, height: 24, borderRadius: "50%", background: T, border: "2px solid white", color: "white", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                title="Change avatar">
                {avatarLoading ? "..." : "✎"}
              </button>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: DARK }}>{displayName}</div>
                {!editingName && <span onClick={() => { setNewUsername(username); setEditingName(true); }} style={{ fontSize: 12, color: T, fontWeight: 600, cursor: "pointer", background: TL, padding: "2px 10px", borderRadius: 20 }}>Edit username</span>}
              </div>
              <div style={{ color: GREY, fontSize: 13, marginTop: 2 }}>{user.email}</div>
              <div style={{ color: GREY, fontSize: 12, marginTop: 2 }}>Member since {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={() => avatarRef.current.click()} disabled={avatarLoading}
                  style={{ fontSize: 12, color: T, fontWeight: 600, cursor: "pointer", background: TL, padding: "2px 10px", borderRadius: 20, border: "none", fontFamily: "inherit" }}>
                  {avatarLoading ? "Uploading..." : "Change avatar"}
                </button>
                {avatarUrl && <button onClick={removeAvatar} disabled={avatarLoading}
                  style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600, cursor: "pointer", background: "#fff0f0", padding: "2px 10px", borderRadius: 20, border: "none", fontFamily: "inherit" }}>
                  Remove
                </button>}
                {avatarMsg && <span style={{ fontSize: 12, color: TD }}>{avatarMsg}</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: T }}>{results.length}</div>
                <div style={{ fontSize: 12, color: GREY }}>Interviews</div>
              </div>
              {avgScore && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T }}>{avgScore}<span style={{ fontSize: 14, color: GREY }}>/10</span></div>
                  <div style={{ fontSize: 12, color: GREY }}>Avg Score</div>
                </div>
              )}
            </div>
          </div>
          {editingName && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", paddingTop: 16, borderTop: `1px solid ${TM}` }}>
              <input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="new username" style={{ flex: 1, minWidth: 160, padding: "9px 14px", borderRadius: 12, border: `1.5px solid ${TM}`, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
              <button className="btn-hover" style={{ ...styles.bigBtn, padding: "9px 20px", fontSize: 13 }} onClick={saveUsername}>Save</button>
              <button onClick={() => setEditingName(false)} style={{ padding: "9px 16px", borderRadius: 30, border: `1.5px solid ${TM}`, background: "white", color: GREY, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              {saveMsg && <span style={{ fontSize: 13, color: TD }}>{saveMsg}</span>}
            </div>
          )}
        </div>

        <h3 style={{ fontWeight: 700, fontSize: 18, color: DARK, marginBottom: 16 }}>Interview History</h3>
        {loading && <div style={{ textAlign: "center", padding: 40, color: GREY }}>Loading...</div>}
        {!loading && results.length === 0 && (
          <div style={{ ...styles.card, textAlign: "center", padding: 48, marginBottom: 32 }}>
            <img src="/no-interviews-yet.png" alt="" style={{ width: 64, height: 64, objectFit: "contain", marginBottom: 12 }} />
            <p style={{ color: GREY, fontSize: 15 }}>No interviews yet. Complete your first one to see results here!</p>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 }}>
          {results.map((r, i) => (
            <div key={r.id} className="card-hover" style={{ ...styles.card, cursor: "pointer", transition: "all .2s" }} onClick={() => setExpanded(expanded === i ? null : i)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: DARK, fontSize: 15 }}>{r.level} {r.role}</div>
                  <div style={{ color: GREY, fontSize: 13, marginTop: 2 }}>
                    {new Date(r.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })} · {r.duration}min · {r.answers_count} answers
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ ...styles.tag, background: `${modeColors[r.mode] || T}22`, color: modeColors[r.mode] || T }}>{r.mode}</span>
                  {r.score && <div style={{ fontWeight: 800, fontSize: 20, color: r.score >= 7 ? "#22c55e" : r.score >= 5 ? "#f59e0b" : "#ef4444" }}>{r.score}<span style={{ fontSize: 13, color: GREY, fontWeight: 400 }}>/10</span></div>}
                  <span style={{ color: GREY, fontSize: 16 }}>{expanded === i ? "▲" : "▼"}</span>
                </div>
              </div>
              {expanded === i && r.verdict && (
                <div style={{ marginTop: 16, padding: "14px 16px", background: TL, borderRadius: 12, fontSize: 14, color: DARK, lineHeight: 1.6, borderLeft: `3px solid ${T}` }}>
                  <strong>Verdict:</strong> {r.verdict}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ ...styles.card, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: DARK, marginBottom: 2 }}>Password</div>
              <div style={{ fontSize: 13, color: GREY }}>Change your account password</div>
            </div>
            {!changingPwd && (
              <button onClick={() => setChangingPwd(true)}
                style={{ fontSize: 12, color: T, fontWeight: 600, cursor: "pointer", background: TL, padding: "6px 14px", borderRadius: 20, border: "none", fontFamily: "inherit" }}>
                Change password
              </button>
            )}
          </div>
          {changingPwd && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${TM}` }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
                  placeholder="New password" style={{ padding: "9px 14px", borderRadius: 12, border: `1.5px solid ${TM}`, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
                <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="Confirm new password" style={{ padding: "9px 14px", borderRadius: 12, border: `1.5px solid ${TM}`, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
                {pwdError && <div style={{ fontSize: 13, color: "#b91c1c", background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 12px" }}>{pwdError}</div>}
                {pwdMsg   && <div style={{ fontSize: 13, color: TD, background: TL, border: `1px solid ${TM}`, borderRadius: 10, padding: "10px 12px" }}>{pwdMsg}</div>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn-hover" onClick={changePassword} disabled={pwdLoading}
                    style={{ ...styles.bigBtn, padding: "9px 20px", fontSize: 13, opacity: pwdLoading ? 0.6 : 1 }}>
                    {pwdLoading ? "..." : "Update Password"}
                  </button>
                  <button onClick={() => { setChangingPwd(false); setNewPwd(""); setConfirmPwd(""); setPwdError(""); }}
                    style={{ padding: "9px 16px", borderRadius: 30, border: `1.5px solid ${TM}`, background: "white", color: GREY, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ ...styles.card, border: "1.5px solid #fca5a5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
            <img src="/deletion-acc.png" alt="" style={{ width: 60, height: 60, objectFit: "contain", flexShrink: 0 }} />
            <h4 style={{ fontWeight: 700, fontSize: 15, color: "#b91c1c", margin: 0 }}>Danger Zone</h4>
          </div>
          <p style={{ color: GREY, fontSize: 13, marginBottom: 16 }}>Deleting your account will permanently remove all your data. This cannot be undone.</p>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={{ padding: "10px 20px", borderRadius: 30, border: "1.5px solid #fca5a5", background: "white", color: "#b91c1c", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Delete Account</button>
          ) : (
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "#b91c1c", fontWeight: 600 }}>Are you sure? This cannot be undone.</span>
              <button onClick={deleteAccount} disabled={deleting} style={{ padding: "10px 20px", borderRadius: 30, border: "none", background: "#ef4444", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                {deleting ? "Deleting..." : "Yes, Delete Everything"}
              </button>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: "10px 16px", borderRadius: 30, border: `1.5px solid ${TM}`, background: "white", color: GREY, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
