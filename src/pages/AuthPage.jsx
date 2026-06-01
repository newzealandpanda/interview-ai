import { useState } from "react";
import { supabase } from "../supabase.js";
import { T, TD, TL, TM, DARK, GREY, styles } from "../constants.js";
import Shell from "../components/Shell.jsx";

export default function AuthPage({ onNav, user, onLogout, onSuccess }) {
  const [isLogin, setIsLogin]   = useState(true);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [message, setMessage]   = useState("");

  async function handleSubmit() {
    setLoading(true); setError(""); setMessage("");
    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else onSuccess(data.user);
    } else {
      if (!username.trim()) { setError("Please enter a username."); setLoading(false); return; }
      if (username.length < 3) { setError("Username must be at least 3 characters."); setLoading(false); return; }
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      if (data.user) await supabase.from("profiles").insert({ id: data.user.id, username: username.trim().toLowerCase() });
      setMessage("Check your email to confirm your account, then sign in.");
    }
    setLoading(false);
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  }

  const input = { width: "100%", padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${TM}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

  return (
    <Shell active="login" onNav={onNav} user={user} onLogout={onLogout}>
      <div style={{ maxWidth: 420, margin: "60px auto", padding: "0 5%" }}>
        <div style={{ ...styles.card, padding: 36 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🤖</div>
            <h2 style={{ ...styles.h2, fontSize: 22, margin: "0 0 6px" }}>{isLogin ? "Welcome back" : "Create account"}</h2>
            <p style={{ color: GREY, fontSize: 14, margin: 0 }}>
              {isLogin ? "Sign in to see your interview history" : "Save your results and track progress"}
            </p>
          </div>

          <button onClick={handleGoogle} style={{ width: "100%", padding: "12px", borderRadius: 30, border: `1.5px solid ${TM}`, background: "white", color: DARK, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: TM }} />
            <span style={{ color: GREY, fontSize: 12 }}>or</span>
            <div style={{ flex: 1, height: 1, background: TM }} />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 600, fontSize: 13, color: DARK, display: "block", marginBottom: 6 }}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="your username" style={input} />
              <div style={{ fontSize: 11, color: GREY, marginTop: 4 }}>Min 3 characters, lowercase. Shown on leaderboard.</div>
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontWeight: 600, fontSize: 13, color: DARK, display: "block", marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={input} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontWeight: 600, fontSize: 13, color: DARK, display: "block", marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleSubmit()} style={input} />
          </div>

          {error   && <div style={{ background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 10, padding: 12, color: "#b91c1c", fontSize: 13, marginBottom: 14 }}>{error}</div>}
          {message && <div style={{ background: TL, border: `1px solid ${TM}`, borderRadius: 10, padding: 12, color: TD, fontSize: 13, marginBottom: 14 }}>{message}</div>}

          <button className="btn-hover" onClick={handleSubmit} disabled={loading} style={{ ...styles.bigBtn, width: "100%", justifyContent: "center", opacity: loading ? 0.6 : 1 }}>
            {loading ? "..." : isLogin ? "Sign In" : "Create Account"}
          </button>

          <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: GREY }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => { setIsLogin(!isLogin); setError(""); setMessage(""); }} style={{ color: T, fontWeight: 700, cursor: "pointer" }}>
              {isLogin ? "Sign Up" : "Sign In"}
            </span>
          </p>
        </div>
      </div>
    </Shell>
  );
}
