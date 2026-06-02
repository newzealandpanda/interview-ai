import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase.js";
import { T, TD, TL, TM, DARK, GREY, styles, ROLES, LEVELS, MODES } from "../constants.js";
import Shell from "../components/Shell.jsx";
import Avatar from "../components/Avatar.jsx";

const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };
const modeColors = { Friendly: "#22c55e", Normal: T, Tough: "#ef4444" };

export default function LeaderboardPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [entries, setEntries]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterRole, setFilterRole] = useState("All");
  const [filterLevel, setFilterLevel] = useState("All");
  const [filterMode, setFilterMode]   = useState("All");

  useEffect(() => {
    fetchLeaderboard();

    // Real-time updates
    const sub = supabase
      .channel("leaderboard")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "interview_results" }, () => fetchLeaderboard())
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  async function fetchLeaderboard() {
    setLoading(true);
    const { data: lb, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("best_score", { ascending: false })
      .limit(50);
    if (error) { setLoading(false); return; }

    // Fetch avatars for all usernames
    const usernames = [...new Set((lb || []).map(e => e.username))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .in("username", usernames);

    const avatarMap = {};
    (profiles || []).forEach(p => { avatarMap[p.username] = p.avatar_url; });

    setEntries((lb || []).map(e => ({ ...e, avatar_url: avatarMap[e.username] || null })));
    setLoading(false);
  }

  const filtered = entries.filter(e =>
    (filterRole  === "All" || e.role  === filterRole) &&
    (filterLevel === "All" || e.level === filterLevel) &&
    (filterMode  === "All" || e.mode  === filterMode)
  );

  const myUsername = user ? null : null; // will match via username

  return (
    <Shell user={user} onLogout={onLogout}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "52px 5%", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: TL, borderRadius: 30, padding: "5px 16px", marginBottom: 14 }}>
          <img src="/leaderboard.png" alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: TD, letterSpacing: 0.8, textTransform: "uppercase" }}>Global Rankings</span>
        </div>
        <h2 style={{ ...styles.h2, marginBottom: 6, textAlign: "center" }}>Leaderboard</h2>
        <p style={{ color: GREY, marginBottom: 32, fontSize: 15, textAlign: "center" }}>
          Top candidates ranked by best interview score. Updated in real time.
          {!user && <span> <span onClick={() => navigate("/login")} style={{ color: T, fontWeight: 700, cursor: "pointer" }}>Sign in</span> to appear on the leaderboard.</span>}
        </p>

        {/* Filters */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
          {/* Role filter */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: GREY, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Role</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["All", ...ROLES.map(r => r.label)].map(r => (
                <button key={r} onClick={() => setFilterRole(r)}
                  style={{ padding: "6px 14px", borderRadius: 30, border: `1.5px solid ${filterRole === r ? T : TM}`, background: filterRole === r ? TL : "white", color: filterRole === r ? TD : GREY, fontWeight: filterRole === r ? 700 : 500, fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Level filter */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: GREY, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Level</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["All", ...LEVELS.map(l => l.label)].map(l => (
                <button key={l} onClick={() => setFilterLevel(l)}
                  style={{ padding: "6px 14px", borderRadius: 30, border: `1.5px solid ${filterLevel === l ? T : TM}`, background: filterLevel === l ? TL : "white", color: filterLevel === l ? TD : GREY, fontWeight: filterLevel === l ? 700 : 500, fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Mode filter */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: GREY, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Mode</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["All", ...MODES.map(m => m.label)].map(m => (
                <button key={m} onClick={() => setFilterMode(m)}
                  style={{ padding: "6px 14px", borderRadius: 30, border: `1.5px solid ${filterMode === m ? T : TM}`, background: filterMode === m ? TL : "white", color: filterMode === m ? TD : GREY, fontWeight: filterMode === m ? 700 : 500, fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: GREY }}>Loading rankings...</div>
        ) : filtered.length === 0 ? (
          <div style={{ ...styles.card, textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
            <p style={{ color: GREY, fontSize: 15 }}>No results yet for this filter. Be the first!</p>
            <button className="btn-hover" style={{ ...styles.bigBtn, marginTop: 16 }} onClick={() => navigate("/practice")}>Start Interview</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 120px 100px 80px 80px 80px", gap: 12, padding: "10px 20px", fontSize: 11, fontWeight: 700, color: GREY, textTransform: "uppercase", letterSpacing: 0.5 }}>
              <div>#</div>
              <div>Player</div>
              <div>Role</div>
              <div>Level / Mode</div>
              <div style={{ textAlign: "center" }}>Interviews</div>
              <div style={{ textAlign: "center" }}>Avg Score</div>
              <div style={{ textAlign: "center" }}>Best Score</div>
            </div>

            {filtered.slice(0, 20).map((entry, i) => {
              const rank = i + 1;
              const isMe = user && entry.username === myUsername;
              const scoreColor = entry.best_score >= 80 ? "#22c55e" : entry.best_score >= 60 ? "#f59e0b" : "#ef4444";

              return (
                <div key={`${entry.username}-${entry.role}-${i}`}
                  style={{ ...styles.card, display: "grid", gridTemplateColumns: "40px 1fr 120px 100px 80px 80px 80px", gap: 12, alignItems: "center", padding: "16px 20px", background: isMe ? TL : "white", borderColor: isMe ? T : TM, animation: `fadeIn .3s ${i * 0.04}s both`, transition: "all .2s" }}
                  className="card-hover">
                  {/* Rank */}
                  <div style={{ fontWeight: 800, fontSize: rank <= 3 ? 20 : 15, color: rank <= 3 ? T : GREY, textAlign: "center" }}>
                    {MEDAL[rank] || rank}
                  </div>

                  {/* Player */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar url={entry.avatar_url} name={entry.username} size={36} />
                    <div>
                      <div style={{ fontWeight: 700, color: DARK, fontSize: 14 }}>
                        {entry.username} {isMe && <span style={{ fontSize: 11, color: T, background: TL, padding: "2px 8px", borderRadius: 20 }}>You</span>}
                      </div>
                      <div style={{ fontSize: 11, color: GREY }}>
                        {new Date(entry.last_interview).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                  </div>

                  {/* Role */}
                  <div style={{ fontSize: 12, color: DARK, fontWeight: 500 }}>{entry.role}</div>

                  {/* Level / Mode */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: DARK }}>{entry.level}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: modeColors[entry.mode] || T }}>{entry.mode}</span>
                  </div>

                  {/* Interviews */}
                  <div style={{ textAlign: "center", fontWeight: 700, color: GREY, fontSize: 14 }}>
                    {entry.total_interviews}
                  </div>

                  {/* Avg score */}
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: GREY }}>{entry.avg_score}</span>
                    <span style={{ fontSize: 11, color: GREY }}>/10</span>
                  </div>

                  {/* Best score */}
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontWeight: 800, fontSize: 20, color: scoreColor }}>{entry.best_score}</span>
                    <span style={{ fontSize: 12, color: GREY }}>/10</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <button className="btn-hover" style={styles.bigBtn} onClick={() => navigate("/practice")}>
            🎤 Practice to Climb the Ranks
          </button>
        </div>
      </div>
    </Shell>
  );
}
