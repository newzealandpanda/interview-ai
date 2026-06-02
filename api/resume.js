import { rateLimit } from "./rateLimit.js";
import { requireAuth } from "./auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (rateLimit(req, res)) return;

  if (!requireAuth(req, res)) return;

  try {
    const { text, role } = req.body;

    if (!text?.trim()) return res.status(400).json({ error: "No text provided" });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1500,
        messages: [
          {
            role: "system",
            content: "You are an expert tech recruiter and career coach with 15 years of experience reviewing resumes for IT roles."
          },
          {
            role: "user",
            content: `Review this resume for a ${role || "Software Engineer"} position and give structured feedback.

RESUME TEXT:
${text.slice(0, 6000)}

Respond in this EXACT format:
OVERALL_SCORE: [1-100]
SUMMARY: [2-3 sentence overall impression]
STRENGTHS:
- [strength 1]
- [strength 2]
- [strength 3]
IMPROVEMENTS:
- [specific improvement 1]
- [specific improvement 2]
- [specific improvement 3]
ATS_SCORE: [1-100]
ATS_TIPS:
- [tip 1]
- [tip 2]
MISSING:
- [missing 1]
- [missing 2]
VERDICT: [2-3 actionable sentences on what to do next]`
          }
        ]
      })
    });

    const data = await response.json();
    const feedbackText = data.choices?.[0]?.message?.content || "";
    res.status(200).json({ feedback: feedbackText });

  } catch {
    res.status(500).json({ error: "Resume analysis failed" });
  }
}
