import formidable from "formidable";
import fs from "fs";
import pdfParse from "pdf-parse";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const form = formidable({ maxFileSize: 5 * 1024 * 1024 });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "File parse error" });

    const file = files.resume?.[0] || files.resume;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const buffer = fs.readFileSync(file.filepath || file.path);
      const pdf = await pdfParse(buffer);
      const text = pdf.text?.slice(0, 6000) || "";

      if (!text.trim()) return res.status(400).json({ error: "Could not extract text from PDF" });

      const role = fields.role?.[0] || fields.role || "Software Engineer";

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
              content: `You are an expert tech recruiter and career coach with 15 years of experience reviewing resumes for IT roles.`
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
- [tip to improve ATS/keyword optimization 1]
- [tip 2]
MISSING:
- [important section or info that's missing 1]
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
      res.status(500).json({ error: "Failed to analyze resume: " + e.message });
    }
  });
}