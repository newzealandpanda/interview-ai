import { rateLimit } from "./rateLimit.js";
import { requireAuth } from "./auth.js";

const ALLOWED_VOICES = new Set([
  "Aaliyah-PlayAI", "Fritz-PlayAI", "Angelo-PlayAI",
  "Arista-PlayAI", "Atlas-PlayAI", "Basil-PlayAI",
  "Briggs-PlayAI", "Calum-PlayAI", "Celeste-PlayAI",
]);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (rateLimit(req, res)) return;

  if (!requireAuth(req, res)) return;

  const { text, voice } = req.body;

  if (!text || typeof text !== "string")
    return res.status(400).json({ error: "Invalid text" });

  if (text.length > 1000)
    return res.status(400).json({ error: "Text too long" });

  const selectedVoice = ALLOWED_VOICES.has(voice) ? voice : "Fritz-PlayAI";

  try {
    const response = await fetch("https://api.groq.com/openai/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "playai-tts",
        input: text,
        voice: selectedVoice,
        response_format: "wav",
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(502).json({ error: err.error?.message || "TTS failed" });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    res.status(200).json({ audio: base64, format: "wav" });
  } catch {
    res.status(500).json({ error: "TTS request failed" });
  }
}
