import { rateLimit } from "./rateLimit.js";
import { requireAuth } from "./auth.js";

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (rateLimit(req, res)) return;

  if (!requireAuth(req, res)) return;

  try {
    const rawBody = await getRawBody(req);
    const contentType = req.headers["content-type"] || "";

    if (!contentType.includes("multipart/form-data"))
      return res.status(400).json({ error: "Expected multipart/form-data" });

    // Forward raw multipart body directly to Groq Whisper
    const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": contentType,
      },
      body: rawBody,
    });

    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      return res.status(502).json({ error: err.error?.message || "STT failed" });
    }

    const data = await groqRes.json();
    res.status(200).json({ text: data.text || "" });
  } catch {
    res.status(500).json({ error: "STT request failed" });
  }
}
