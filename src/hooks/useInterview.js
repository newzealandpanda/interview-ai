import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabase.js";
import { MODES, DEFAULT_DURATION, parseFeedback } from "../constants.js";

export function useInterview() {
  const [role, setRole]           = useState(null);
  const [level, setLevel]         = useState(null);
  const [mode, setMode]           = useState(null);
  const [duration, setDuration]   = useState(20);
  const [page, setPage]           = useState("home");
  const [qIndex, setQIndex]       = useState(0);
  const [timeLeft, setTimeLeft]   = useState(DEFAULT_DURATION);
  const [running, setRunning]     = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking]   = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [feedbackRaw, setFeedbackRaw] = useState("");
  const [loadingFB, setLoadingFB] = useState(false);
  const [micAllowed, setMicAllowed] = useState(null);
  const [user, setUser]           = useState(null);

  const timerRef       = useRef(null);
  const synthRef       = useRef(window.speechSynthesis);
  const recognRef      = useRef(null);
  const sessionRef     = useRef([]);
  const endedRef       = useRef(false);
  const conversationRef = useRef([]);
  const questionsAsked = useRef(0);

  const MIN_QUESTIONS = 5;
  const MAX_QUESTIONS = 12;

  // ── AUTH ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user || null));
    return () => listener.subscription.unsubscribe();
  }, []);

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
  const speak = useCallback((text, onDone) => {
    const synth = synthRef.current;
    synth.cancel();
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
      setSpeaking(true);
      utt.onend  = () => { setSpeaking(false); onDone?.(); };
      utt.onerror = () => { setSpeaking(false); onDone?.(); };
      synth.speak(utt);
    };
    const voices = synth.getVoices();
    if (voices.length > 0) doSpeak();
    else { synth.onvoiceschanged = () => { synth.onvoiceschanged = null; doSpeak(); }; }
  }, []);

  // ── STT ───────────────────────────────────────────────────────────────────
  const startListening = useCallback((onResult) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setStatusMsg("Speech recognition not supported in this browser."); return; }
    const rec = new SR();
    recognRef.current = rec;
    rec.lang = "en-US"; rec.interimResults = true; rec.maxAlternatives = 1; rec.continuous = true;
    let finalText = ""; let silenceTimer = null; const SILENCE_MS = 2200;
    setListening(true); setStatusMsg("🎙 Listening...");
    rec.onresult = (e) => {
      let interim = ""; finalText = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      setStatusMsg("🎙 " + (finalText + interim).trim());
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        const result = finalText.trim() || (finalText + interim).trim();
        if (result.length > 2) { rec.stop(); setListening(false); setStatusMsg(""); onResult(result); }
      }, SILENCE_MS);
    };
    rec.onerror = (e) => {
      clearTimeout(silenceTimer);
      if (e.error === "no-speech") {
        setStatusMsg("🎙 No speech detected, listening again...");
        rec.stop();
        setTimeout(() => { if (!endedRef.current) startListening(onResult); }, 500);
      } else { setListening(false); setStatusMsg("Mic error: " + e.error); }
    };
    rec.onend = () => { clearTimeout(silenceTimer); if (finalText.trim().length === 0 && !endedRef.current) setListening(false); };
    rec.start();
  }, []);

  // ── GROQ ──────────────────────────────────────────────────────────────────
  async function askGroq(messages, system) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, system }),
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
    const system = currentMode.system(role?.label || "IT professional", level?.label || "Mid-level") + `
CONTEXT:
- Questions asked: ${asked}, Time remaining: ${Math.floor(timeRemaining / 60)} min
- Total duration: ${duration} min, Min: ${MIN_QUESTIONS}, Max: ${MAX_QUESTIONS}
- If asked < ${MIN_QUESTIONS} - always continue
- If time < 3 min OR asked >= ${MAX_QUESTIONS} - output only: END_INTERVIEW`;
    try {
      const response = await askGroq(conversationRef.current, system);
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
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setMicAllowed(false); return; }
    try { await navigator.mediaDevices.getUserMedia({ audio: true }); setMicAllowed(true); }
    catch { setMicAllowed(false); return; }
    endedRef.current = false; sessionRef.current = []; conversationRef.current = [];
    questionsAsked.current = 0; setTranscript([]); setQIndex(0);
    setTimeLeft(duration * 60); setRunning(true); setPage("interview");
    conversationRef.current = [{ role: "user", content: `[START] Mock interview for ${level?.label} ${role?.label}. Mode: ${mode?.label || "Normal"}. Begin with an opener.` }];
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
    recognRef.current?.abort(); synthRef.current.cancel();
    setSpeaking(false); setListening(false); generateFeedback();
  }

  // ── FEEDBACK ──────────────────────────────────────────────────────────────
  async function generateFeedback() {
    setPage("feedback"); setLoadingFB(true);
    const answers = sessionRef.current.filter(e => e.role === "user").map(e => e.text);
    const conv = sessionRef.current.map(e => `${e.role === "ai" ? "Interviewer" : "Candidate"}: ${e.text}`).join("\n");
    if (answers.length === 0) {
      setFeedbackRaw("OVERALL_SCORE: N/A\nVERDICT: No answers were recorded. Please try again.");
      setLoadingFB(false); return;
    }
    try {
      const system = `You are a senior tech hiring manager. Interview mode: ${mode?.label || "Normal"}. Calibrate tone accordingly.`;
      const prompt = `Analyze this mock interview for a ${level?.label} ${role?.label} role.\n\nTRANSCRIPT:\n${conv}\n\nRespond in this EXACT format:\nOVERALL_SCORE: [1-10]\nSTRENGTHS:\n• [point 1]\n• [point 2]\n• [point 3]\nWEAKNESSES:\n• [point 1]\n• [point 2]\nTIPS:\n• [tip 1]\n• [tip 2]\n• [tip 3]\nVERDICT: [2-3 sentences]`;
      const text = await askGroq([{ role: "user", content: prompt }], system);
      const finalText = text || "OVERALL_SCORE: N/A\nVERDICT: Could not generate feedback.";
      setFeedbackRaw(finalText);
      if (user) {
        const scoreMatch = finalText.match(/OVERALL_SCORE[:\s]+(\d+)/i);
        const verdictMatch = finalText.match(/VERDICT[:\s]+([\s\S]*?)$/i);
        await supabase.from("interview_results").insert({
          user_id: user.id, role: role?.label, level: level?.label,
          mode: mode?.label, duration,
          score: scoreMatch ? parseInt(scoreMatch[1]) : null,
          answers_count: answers.length, feedback_raw: finalText,
          verdict: verdictMatch ? verdictMatch[1].trim().slice(0, 500) : "",
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
    // state
    page, setPage, user, setUser,
    role, setRole, level, setLevel, mode, setMode, duration, setDuration,
    qIndex, timeLeft, running, transcript, listening, speaking, statusMsg,
    feedbackRaw, loadingFB, micAllowed, fb, pct, timerColor,
    // actions
    startSession, endSession, speak,
  };
}
