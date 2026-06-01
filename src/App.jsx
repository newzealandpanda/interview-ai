import { supabase } from "./supabase.js";
import { useInterview } from "./hooks/useInterview.js";
import HomePage      from "./pages/HomePage.jsx";
import SelectPage    from "./pages/SelectPage.jsx";
import InterviewPage from "./pages/InterviewPage.jsx";
import FeedbackPage  from "./pages/FeedbackPage.jsx";
import ResourcesPage from "./pages/ResourcesPage.jsx";
import AuthPage      from "./pages/AuthPage.jsx";
import ProfilePage   from "./pages/ProfilePage.jsx";
import ResumePage    from "./pages/ResumePage.jsx";
 
export default function App() {
  const iv = useInterview();
 
  const onLogout = async () => {
    await supabase.auth.signOut();
    iv.setUser(null);
    iv.setPage("home");
  };
 
  const shellProps = {
    onNav: iv.setPage,
    user: iv.user,
    onLogout,
  };
 
  if (iv.page === "interview") return (
    <InterviewPage
      role={iv.role} level={iv.level} mode={iv.mode} duration={iv.duration}
      timeLeft={iv.timeLeft} timerColor={iv.timerColor} pct={iv.pct}
      transcript={iv.transcript} speaking={iv.speaking}
      listening={iv.listening} statusMsg={iv.statusMsg}
      onEnd={iv.endSession}
    />
  );
 
  if (iv.page === "select") return (
    <SelectPage
      {...shellProps}
      role={iv.role} setRole={iv.setRole}
      level={iv.level} setLevel={iv.setLevel}
      mode={iv.mode} setMode={iv.setMode}
      duration={iv.duration} setDuration={iv.setDuration}
      micAllowed={iv.micAllowed}
      onStart={iv.startSession}
    />
  );
 
  if (iv.page === "feedback") return (
    <FeedbackPage
      {...shellProps}
      role={iv.role} level={iv.level} mode={iv.mode}
      transcript={iv.transcript} loadingFB={iv.loadingFB}
      feedbackRaw={iv.feedbackRaw} fb={iv.fb}
      onPracticeAgain={() => {
        iv.setPage("select");
        iv.setRole(null); iv.setLevel(null);
        iv.setMode(null); iv.setDuration(20);
      }}
    />
  );
 
  if (iv.page === "login") return (
    <AuthPage
      {...shellProps}
      onSuccess={(u) => { iv.setUser(u); iv.setPage("profile"); }}
    />
  );
 
  if (iv.page === "profile") return (
    <ProfilePage
      {...shellProps}
      onLogin={() => iv.setPage("login")}
      onDeleted={() => { iv.setUser(null); iv.setPage("home"); }}
    />
  );
 
  if (iv.page === "resume") return (
    <ResumePage {...shellProps} />
  );
 
  if (iv.page === "resources") return (
    <ResourcesPage {...shellProps} />
  );
 
  return <HomePage {...shellProps} onNav={iv.setPage} />;
}