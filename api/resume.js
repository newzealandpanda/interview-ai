export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const boundary = req.headers["content-type"]?.split("boundary=")[1];
    if (!boundary) return res.status(400).json({ error: "No boundary found" });

    const bodyStr = buffer.toString("binary");
    const parts = bodyStr.split("--" + boundary);

    let pdfBuffer = null;
    let role = "Software Engineer";

    for (const part of parts) {
      if (part.includes('name="resume"')) {
        const start = part.indexOf("\r\n\r\n") + 4;
        const end = part.lastIndexOf("\r\n");
        if (start > 3 && end > start) {
          pdfBuffer = Buffer.from(part.slice(start, end), "binary");
        }
      }
      if (part.includes('name="role"')) {
        const start = part.indexOf("\r\n\r\n") + 4;
        const end = part.lastIndexOf("\r\n");
        if (start > 3) role = part.slice(start, end).trim();
      }
    }

    if (!pdfBuffer) return res.status(400).json({ error: "No PDF found in request" });

    const { default: pdfParse } = await import("pdf-parse");
    const pdf = await pdfParse(pdfBuffer);
    const text = pdf.text?.slice(0, 6000) || "";

    if (!text.trim()) return res.status(400).json({ error: "Could not extract text from PDF" });

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
            content: `Review this resume for a ${role} position and give structured feedback.

RESUME TEXT:
${text}

Respond in this EXACT format:
OVERALL_SCORE: [1-10]
SUMMARY: [2-3 sentence overall impression]
STRENGTHS:
- [strength 1]
- [strength 2]
- [strength 3]
IMPROVEMENTS:
- [specific improvement 1]
- [specific improvement 2]
- [specific improvement 3]
ATS_SCORE: [1-10]
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

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}