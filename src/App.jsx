import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "./supabase.js";
import { useInterview } from "./hooks/useInterview.js";
import HomePage         from "./pages/HomePage.jsx";
import SelectPage       from "./pages/SelectPage.jsx";
import InterviewPage    from "./pages/InterviewPage.jsx";
import FeedbackPage     from "./pages/FeedbackPage.jsx";
import ResourcesPage    from "./pages/ResourcesPage.jsx";
import AuthPage         from "./pages/AuthPage.jsx";
import ProfilePage      from "./pages/ProfilePage.jsx";
import ResumePage       from "./pages/ResumePage.jsx";
import LeaderboardPage  from "./pages/LeaderboardPage.jsx";

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const iv = useInterview({ navigate });

  const onLogout = async () => {
    await supabase.auth.signOut();
    iv.setUser(null);
    navigate("/");
  };

  const shellProps = { user: iv.user, onLogout };

  return (
    <Routes>
      <Route path="/" element={
        <HomePage {...shellProps} />
      } />

      <Route path="/practice" element={
        <SelectPage
          {...shellProps}
          role={iv.role} setRole={iv.setRole}
          level={iv.level} setLevel={iv.setLevel}
          mode={iv.mode} setMode={iv.setMode}
          duration={iv.duration} setDuration={iv.setDuration}
          micAllowed={iv.micAllowed}
          onStart={iv.startSession}
        />
      } />

      <Route path="/interview" element={
        <InterviewPage
          role={iv.role} level={iv.level} mode={iv.mode} duration={iv.duration}
          timeLeft={iv.timeLeft} timerColor={iv.timerColor} pct={iv.pct}
          transcript={iv.transcript} speaking={iv.speaking}
          listening={iv.listening} statusMsg={iv.statusMsg}
          onEnd={iv.endSession}
        />
      } />

      <Route path="/feedback" element={
        <FeedbackPage
          {...shellProps}
          role={iv.role} level={iv.level} mode={iv.mode}
          transcript={iv.transcript} loadingFB={iv.loadingFB}
          feedbackRaw={iv.feedbackRaw} fb={iv.fb}
          onPracticeAgain={() => {
            iv.setRole(null); iv.setLevel(null);
            iv.setMode(null); iv.setDuration(20);
            navigate("/practice");
          }}
        />
      } />

      <Route path="/login" element={
        <AuthPage
          {...shellProps}
          onSuccess={(u) => { iv.setUser(u); navigate("/profile"); }}
        />
      } />

      <Route path="/profile" element={
        <ProfilePage
          {...shellProps}
          onLogin={() => navigate("/login")}
          onDeleted={() => { iv.setUser(null); navigate("/"); }}
        />
      } />

      <Route path="/resume" element={
        <ResumePage {...shellProps} />
      } />

      <Route path="/jobs" element={
        <ResourcesPage {...shellProps} />
      } />

      <Route path="/leaderboard" element={
        <LeaderboardPage {...shellProps} />
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
