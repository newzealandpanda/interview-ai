import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase.js";
import { T, TD, TL, TM, DARK, GREY, styles } from "../constants.js";
import Shell from "../components/Shell.jsx";

export default function ResetPasswordPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [password, setPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [message, setMessage]           = useState("");
  const [ready, setReady]               = useState(false);

  useEffect(() => {
    // Supabase fires onAuthStateChange with PASSWORD_RECOVERY event
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  function validatePassword(pwd) {
    if (
      pwd.length < 8 ||
      !/[A-Za-z]/.test(pwd) ||
      !/[0-9]/.test(pwd) ||
      !/[^A-Za-z0-9]/.test(pwd)
    ) return "Password must be at least 8 characters and include a letter, a number, and a special character.";
    return null;
  }

  async function handleReset() {
    setError(""); setMessage("");
    const pwdError = validatePassword(password);
    if (pwdError) { setError(pwdError); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else {
      setMessage("Password updated successfully!");
      setTimeout(() => navigate("/"), 2000);
    }
    setLoading(false);
  }

  const input = {
    width: "100%", padding: "11px 14px", borderRadius: 12,
    border: `1.5px solid ${TM}`, fontSize: 14, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box", color: DARK,
  };

  return (
    <Shell user={user} onLogout={onLogout}>
      <div style={{ maxWidth: 500, margin: "60px auto", padding: "0 5%" }}>
        <div style={{ ...styles.card, padding: "40px 44px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <img src="/friendly.png" alt="" style={{ width: 72, height: 72, objectFit: "contain", marginBottom: 8 }} />
            <h2 style={{ ...styles.h2, fontSize: 22, margin: "0 0 6px" }}>Set new password</h2>
            <p style={{ color: GREY, fontSize: 14, margin: 0 }}>Choose a strong password for your account</p>
          </div>

          {!ready ? (
            <div style={{ textAlign: "center", color: GREY, fontSize: 14, padding: "20px 0" }}>
              Verifying reset link...
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontWeight: 600, fontSize: 13, color: DARK, display: "block", marginBottom: 6 }}>New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="8+ chars, letter, number, symbol" style={input} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontWeight: 600, fontSize: 13, color: DARK, display: "block", marginBottom: 6 }}>Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat your password" onKeyDown={e => e.key === "Enter" && handleReset()} style={input} />
              </div>

              {error   && <div style={{ background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 10, padding: 12, color: "#b91c1c", fontSize: 13, marginBottom: 14 }}>{error}</div>}
              {message && <div style={{ background: TL, border: `1px solid ${TM}`, borderRadius: 10, padding: 12, color: TD, fontSize: 13, marginBottom: 14 }}>{message}</div>}

              <button className="btn-hover" onClick={handleReset} disabled={loading} style={{ ...styles.bigBtn, width: "100%", justifyContent: "center", opacity: loading ? 0.6 : 1 }}>
                {loading ? "..." : "Update Password"}
              </button>
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}
