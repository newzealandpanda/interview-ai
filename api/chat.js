import { rateLimit } from "./rateLimit.js";
import { requireAuth } from "./auth.js";

const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 12;

const MODE_SYSTEMS = {
  friendly: (role, level) => `You are Jamie, a warm and encouraging interviewer. You are interviewing a ${level} ${role} candidate.
YOUR PERSONALITY: Genuinely supportive and patient. When an answer is unclear, ask a gentle clarifying question. Create a conversational, low-pressure atmosphere.
INTERVIEW RULES: Ask ONE short question at a time (max 2 sentences). React specifically to what was just said. Output the question only - no preamble, no filler.`,

  normal: (role, level) => `You are Alex, a professional senior interviewer. You are interviewing a ${level} ${role} candidate.
YOUR STYLE: Neutral, professional tone. Evaluate both technical depth and communication clarity. If an answer is vague, ask a direct follow-up.
INTERVIEW RULES: Ask ONE focused question at a time (max 2 sentences). Build directly on what the candidate just said. Output the question only - no meta-commentary.`,

  tough: (role, level) => `You are Morgan, a demanding principal engineer at a FAANG-level company. You are interviewing a ${level} ${role} candidate.
YOUR STYLE: Direct, skeptical by default. Challenge vague answers immediately. Never accept buzzwords without proof.
INTERVIEW RULES: Ask ONE precise question at a time (max 2 sentences). Each question harder than the previous. Output the question only - no filler.`,
};

const MODE_LABELS = { friendly: "Friendly", normal: "Normal", tough: "Tough" };

function buildInterviewSystem(role, level, mode, asked, timeRemaining, duration, jobDescription) {
  const base = (MODE_SYSTEMS[mode] || MODE_SYSTEMS.normal)(
    role || "IT professional",
    level || "Mid-level"
  );
  const jdBlock = jobDescription?.trim()
    ? `
JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}
Prioritize questions relevant to this job description. Reference specific requirements when asking questions.`
    : "";
  return base + jdBlock + `
CONTEXT:
- Questions asked: ${asked}, Time remaining: ${Math.floor(timeRemaining / 60)} min
- Total duration: ${duration} min, Min: ${MIN_QUESTIONS}, Max: ${MAX_QUESTIONS}
- If asked < ${MIN_QUESTIONS} - always continue
- If time < 3 min OR asked >= ${MAX_QUESTIONS} - output only: END_INTERVIEW`;
}

function buildFeedbackSystem(mode) {
  const label = MODE_LABELS[mode] || "Normal";
  return `You are a senior tech hiring manager. Interview mode: ${label}. Calibrate tone accordingly.`;
}

const ALLOWED_ROLES = new Set(["user", "assistant"]);
const ALLOWED_TYPES = new Set(["interview", "feedback"]);
const ALLOWED_MODES = new Set(["friendly", "normal", "tough"]);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (rateLimit(req, res)) return;

  if (!requireAuth(req, res)) return;

  const { messages, type, role, level, mode, asked, timeRemaining, duration, jobDescription } = req.body;

  if (!Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: "Invalid messages" });

  if (messages.length > 30)
    return res.status(400).json({ error: "Too many messages" });

  for (const msg of messages) {
    if (!msg || typeof msg !== "object")
      return res.status(400).json({ error: "Invalid message format" });
    if (!ALLOWED_ROLES.has(msg.role))
      return res.status(400).json({ error: "Invalid message role" });
    if (typeof msg.content !== "string")
      return res.status(400).json({ error: "Invalid message content" });
    if (msg.content.length > 4000)
      return res.status(400).json({ error: "Message too long" });
  }

  if (type && !ALLOWED_TYPES.has(type))
    return res.status(400).json({ error: "Invalid type" });

  if (mode && !ALLOWED_MODES.has(mode))
    return res.status(400).json({ error: "Invalid mode" });

  if (jobDescription !== undefined && typeof jobDescription !== "string")
    return res.status(400).json({ error: "Invalid jobDescription" });

  if (jobDescription && jobDescription.length > 3000)
    return res.status(400).json({ error: "Job description too long" });

  const system =
    type === "feedback"
      ? buildFeedbackSystem(mode)
      : buildInterviewSystem(role, level, mode, asked ?? 0, timeRemaining ?? 0, duration ?? 20, jobDescription);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 150,
        temperature: 0.7,
        messages: [
          { role: "system", content: system },
          ...messages,
        ],
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    res.status(200).json({ text });
  } catch {
    res.status(500).json({ error: "Groq request failed" });
  }
}
