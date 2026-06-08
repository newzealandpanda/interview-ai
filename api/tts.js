import { rateLimit } from "./rateLimit.js";
import { requireAuth } from "./auth.js";

const ALLOWED_VOICES = new Set([
  "aura", "luna", "stella", "athena", "hera",
  "orion", "arcas", "perseus", "angus", "orpheus",
  "helios", "zeus", "nova", "sky", "echo", "river",
  "troy", "dan", "tara", "william",
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

  const selectedVoice = ALLOWED_VOICES.has(voice) ? voice : "troy";

  try {
    const response = await fetch("https://api.groq.com/openai/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "canopylabs/orpheus-v1-english",
        input: text,
        voice: selectedVoice,
        response_format: "wav",
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("Groq TTS error:", response.status, JSON.stringify(err));
      return res.status(502).json({ error: err.error?.message || "TTS failed", status: response.status, detail: err });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    res.status(200).json({ audio: base64, format: "wav" });
  } catch {
    res.status(500).json({ error: "TTS request failed" });
  }
}
