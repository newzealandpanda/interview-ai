import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabase.js";
import { MODES, DEFAULT_DURATION, parseFeedback } from "../constants.js";

const MODE_VOICES = { friendly: "hannah", normal: "troy", tough: "austin" };

export function useInterview({ navigate }) {
  const [role, setRole]         = useState(null);
  const [level, setLevel]       = useState(null);
  const [mode, setMode]         = useState(null);
  const [duration, setDuration] = useState(20);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION);
  const [running, setRunning]   = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [listening, setListening]   = useState(false);
  const [speaking, setSpeaking]     = useState(false);
  const [statusMsg, setStatusMsg]   = useState("");
  const [feedbackRaw, setFeedbackRaw] = useState("");
  const [loadingFB, setLoadingFB]   = useState(false);
  const [micAllowed, setMicAllowed] = useState(null);
  const [user, setUser]             = useState(null);
  const [qIndex, setQIndex]         = useState(0);
  const [avatarUrl, setAvatarUrl]   = useState(null);
  const [jobDescription, setJobDescription] = useState("");

  const timerRef        = useRef(null);
  const audioRef        = useRef(null);
  const modeRef         = useRef(null);
  const mediaRecRef     = useRef(null);
  const sessionRef      = useRef([]);
  const endedRef        = useRef(false);
  const conversationRef = useRef([]);
  const questionsAsked  = useRef(0);

  const MIN_QUESTIONS = 5;
  const MAX_QUESTIONS = 12;

  useEffect(() => { modeRef.current = mode; }, [mode]);

  // ── AUTH ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user || null;
      setUser(u);
      if (u) loadAvatar(u.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user || null;
      setUser(u);
      if (u) loadAvatar(u.id);
      else setAvatarUrl(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadAvatar(userId) {
    const { data } = await supabase.from("profiles").select("avatar_url").eq("id", userId).single();
    setAvatarUrl(data?.avatar_url || null);
  }

  // ── TIMER ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); endSession(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [running]);

  // ── TTS ───────────────────────────────────────────────────────────────────
  const speakBrowser = useCallback((text, onDone) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    setSpeaking(true);
    const doSpeak = () => {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "en-US"; utt.rate = 0.93; utt.pitch = 1.0;
      const voices = synth.getVoices();
      const voice =
        voices.find(v => v.name === "Google US English") ||
        voices.find(v => /microsoft.*english/i.test(v.name) && v.lang === "en-US") ||
        voices.find(v => v.lang === "en-US") ||
        voices.find(v => v.lang.startsWith("en"));
      if (voice) utt.voice = voice;
      utt.onend  = () => { setSpeaking(false); onDone?.(); };
      utt.onerror = () => { setSpeaking(false); onDone?.(); };
      synth.speak(utt);
    };
    const voices = synth.getVoices();
    if (voices.length > 0) doSpeak();
    else { synth.onvoiceschanged = () => { synth.onvoiceschanged = null; doSpeak(); }; }
  }, []);

  const speak = useCallback((text, onDone) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    speakBrowser(text, onDone);
  }, [speakBrowser]);

  // ── STT ───────────────────────────────────────────────────────────────────
  const startListening = useCallback((onResult) => {
    setListening(true); setStatusMsg("🎙 Listening...");
    const chunks = [];
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecRef.current = recorder;
      let silenceTimer = null;
      const SILENCE_MS = 3000;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      source.connect(analyser);
      const freqData = new Uint8Array(analyser.frequencyBinCount);

      const resetSilence = () => {
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          if (recorder.state === "recording") recorder.stop();
        }, SILENCE_MS);
      };

      const activityCheck = setInterval(() => {
        analyser.getByteFrequencyData(freqData);
        const volume = freqData.reduce((a, b) => a + b, 0) / freqData.length;
        if (volume > 10) resetSilence();
      }, 200);

      resetSilence();
      recorder.start();

      recorder.onstop = async () => {
        clearInterval(activityCheck);
        audioCtx.close();
        stream.getTracks().forEach(t => t.stop());
        setListening(false); setStatusMsg("");
        if (endedRef.current) return;
        if (chunks.length === 0) { startListening(onResult); return; }
        try {
          const blob = new Blob(chunks, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("file", blob, "audio.webm");
          formData.append("model", "whisper-large-v3-turbo");
          formData.append("language", "en");
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token || "";
          const res = await fetch("/api/stt", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData,
          });
          const data = await res.json();
          const text = (data.text || "").trim();
          if (text.length > 2 && !endedRef.current) onResult(text);
          else if (!endedRef.current) startListening(onResult);
        } catch {
          if (!endedRef.current) startListening(onResult);
        }
      };
    }).catch(() => {
      setListening(false);
      setStatusMsg("Mic error. Please allow microphone access.");
    });
  }, []);

  // ── GROQ ──────────────────────────────────────────────────────────────────
  async function askGroq(messages, params = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || "";
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ messages, ...params }),
    });
    const data = await res.json();
    return data.text || "";
  }

  // ── INTERVIEW TURN ────────────────────────────────────────────────────────
  async function runInterviewTurn() {
    if (endedRef.current) return;
    const asked = questionsAsked.current;
    const timeRemaining = timeLeft;
    setStatusMsg("AI is thinking..."); setSpeaking(true);
    const currentMode = mode || MODES[1];
    try {
      const response = await askGroq(conversationRef.current, {
        type: "interview",
        role: role?.label || "IT professional",
        level: level?.label || "Mid-level",
        mode: currentMode.id,
        asked,
        timeRemaining,
        duration,
        jobDescription: jobDescription || "",
      });
      setSpeaking(false); setStatusMsg("");
      if (!response || endedRef.current) return;
      if (response.trim().toUpperCase().includes("END_INTERVIEW") || asked >= MAX_QUESTIONS) {
        speak("That's all the questions I have. Thank you for your time - I'll now prepare your feedback.", () => endSession());
        return;
      }
      questionsAsked.current += 1; setQIndex(questionsAsked.current);
      const aiEntry = { role: "ai", text: response };
      setTranscript(prev => [...prev, aiEntry]);
      sessionRef.current = [...sessionRef.current, aiEntry];
      conversationRef.current = [...conversationRef.current, { role: "assistant", content: response }];
      speak(response, () => {
        if (endedRef.current) return;
        startListening((userText) => {
          if (endedRef.current) return;
          const uEntry = { role: "user", text: userText };
          setTranscript(prev => [...prev, uEntry]);
          sessionRef.current = [...sessionRef.current, uEntry];
          conversationRef.current = [...conversationRef.current, { role: "user", content: userText }];
          runInterviewTurn();
        });
      });
    } catch {
      setSpeaking(false); setStatusMsg("Connection error, retrying...");
      setTimeout(() => { if (!endedRef.current) runInterviewTurn(); }, 2000);
    }
  }

  // ── START / END ───────────────────────────────────────────────────────────
  async function startSession() {
    try { await navigator.mediaDevices.getUserMedia({ audio: true }); setMicAllowed(true); }
    catch { setMicAllowed(false); return; }
    endedRef.current = false; sessionRef.current = []; conversationRef.current = [];
    questionsAsked.current = 0; setTranscript([]); setQIndex(0);
    setTimeLeft(duration * 60); setRunning(true);
    navigate("/interview");
    conversationRef.current = [{ role: "user", content: `[START] Mock interview for ${level?.label} ${role?.label}. Mode: ${mode?.label || "Normal"}.${jobDescription ? " Tailor questions to the provided job description." : ""} Begin with an opener.` }];
    const greetings = {
      friendly: `Hi there! I'm Jamie. We have ${duration} minutes for a ${level?.label} ${role?.label} interview. Take your time and speak naturally. Ready?`,
      normal:   `Hello, I'm Alex. We have ${duration} minutes for a ${level?.label} ${role?.label} interview. Let's get started.`,
      tough:    `Let's begin. ${duration} minutes, ${level?.label} ${role?.label}. I expect specific answers. Introduce yourself.`,
    };
    speak(greetings[mode?.id || "normal"], () => runInterviewTurn());
  }

  function endSession() {
    if (endedRef.current) return;
    endedRef.current = true; clearInterval(timerRef.current); setRunning(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (mediaRecRef.current?.state === "recording") mediaRecRef.current.stop();
    setSpeaking(false); setListening(false); generateFeedback();
  }

  // ── FEEDBACK ──────────────────────────────────────────────────────────────
  async function generateFeedback() {
    navigate("/feedback");
    setLoadingFB(true);
    const answers = sessionRef.current.filter(e => e.role === "user").map(e => e.text);
    const conv = sessionRef.current.map(e => `${e.role === "ai" ? "Interviewer" : "Candidate"}: ${e.text}`).join("\n");
    if (answers.length === 0) {
      setFeedbackRaw("OVERALL_SCORE: N/A\nVERDICT: No answers were recorded. Please try again.");
      setLoadingFB(false); return;
    }
    try {
      const prompt = `Analyze this mock interview for a ${level?.label} ${role?.label} role.\n\nTRANSCRIPT:\n${conv}\n\nRespond in this EXACT format:\nOVERALL_SCORE: [1-100]\nSTRENGTHS:\n• [point 1]\n• [point 2]\n• [point 3]\nWEAKNESSES:\n• [point 1]\n• [point 2]\nTIPS:\n• [tip 1]\n• [tip 2]\n• [tip 3]\nVERDICT: [2-3 sentences]`;
      const text = await askGroq([{ role: "user", content: prompt }], {
        type: "feedback",
        mode: mode?.id,
      });
      const finalText = text || "OVERALL_SCORE: N/A\nVERDICT: Could not generate feedback.";
      setFeedbackRaw(finalText);
      if (user) {
        const scoreMatch = finalText.match(/OVERALL_SCORE[:\s]+(\d+)/i);
        const verdictMatch = finalText.match(/VERDICT[:\s]+([\s\S]*?)$/i);
        await supabase.from("interview_results").insert({
          user_id: user.id, role: role?.label, level: level?.label,
          mode: mode?.label, duration,
          score: scoreMatch ? Math.min(100, Math.max(1, parseInt(scoreMatch[1]))) : null,
          answers_count: answers.length, feedback_raw: finalText,
          verdict: verdictMatch ? verdictMatch[1].trim().slice(0, 500) : "",
          transcript: JSON.stringify(sessionRef.current),
        });
      }
    } catch {
      setFeedbackRaw("OVERALL_SCORE: N/A\nVERDICT: Could not connect. Please check your connection.");
    }
    setLoadingFB(false);
  }

  const fb = parseFeedback(feedbackRaw);
  const totalSec = duration * 60;
  const pct = Math.round(((totalSec - timeLeft) / totalSec) * 100);
  const timerColor = timeLeft < 120 ? "#ff6b6b" : timeLeft < 300 ? "#f59e0b" : "#45A29E";

  return {
    user, setUser, avatarUrl, setAvatarUrl,
    role, setRole, level, setLevel, mode, setMode, duration, setDuration,
    jobDescription, setJobDescription,
    qIndex, timeLeft, running, transcript, listening, speaking, statusMsg,
    feedbackRaw, loadingFB, micAllowed, fb, pct, timerColor,
    startSession, endSession, speak,
  };
}
