import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";
import { T, TD, TL, TM, DARK, GREY, styles } from "../constants.js";
import Shell from "../components/Shell.jsx";
import FBCard from "../components/FBCard.jsx";
import Waveform from "../components/Waveform.jsx";

export default function ResumePage({ user, onLogout }) {
  const [file, setFile]             = useState(null);
  const [targetRole, setTargetRole] = useState("QA Engineer");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState("");
  const [dragging, setDragging]     = useState(false);
  const [extracting, setExtracting] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (!window.pdfjsLib) {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; };
      document.head.appendChild(s);
    }
    if (!window.mammoth) {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
      document.head.appendChild(s);
    }
  }, []);

  async function extractTextFromPDF(f) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(e.target.result) }).promise;
          let text = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(" ") + "\n";
          }
          resolve(text);
        } catch (err) { reject(err); }
      };
      reader.readAsArrayBuffer(f);
    });
  }

  async function extractTextFromDOCX(f) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try { resolve((await window.mammoth.extractRawText({ arrayBuffer: e.target.result })).value); }
        catch (err) { reject(err); }
      };
      reader.readAsArrayBuffer(f);
    });
  }

  function parseResult(text) {
    const get = (key, next) => { const m = text.match(new RegExp(`${key}[:\\s]+([\\s\\S]*?)(?=${next}|$)`, "i")); return m ? m[1].trim() : ""; };
    return {
      score:    text.match(/OVERALL_SCORE[:\s]+(\d+)/i)?.[1] || "",
      ats:      text.match(/ATS_SCORE[:\s]+(\d+)/i)?.[1] || "",
      summary:  get("SUMMARY",      "STRENGTHS|IMPROVEMENTS|ATS_SCORE|MISSING|VERDICT"),
      strengths:get("STRENGTHS",    "IMPROVEMENTS|ATS_SCORE|MISSING|VERDICT"),
      improve:  get("IMPROVEMENTS", "ATS_SCORE|MISSING|VERDICT"),
      ats_tips: get("ATS_TIPS",     "MISSING|VERDICT"),
      missing:  get("MISSING",      "VERDICT"),
      verdict:  get("VERDICT",      "ZZZEND"),
    };
  }

  async function analyzeResume() {
    if (!file) return;
    setError(""); setResult(null);
    const isPDF = file.type === "application/pdf";
    const isDOCX = file.name.endsWith(".docx");
    if (isPDF && !window.pdfjsLib) { setError("PDF reader is loading, please wait."); return; }
    if (isDOCX && !window.mammoth) { setError("DOCX reader is loading, please wait."); return; }
    setExtracting(true);
    let resumeText = "";
    try {
      if (isPDF) resumeText = await extractTextFromPDF(file);
      else if (isDOCX) resumeText = await extractTextFromDOCX(file);
      else { setExtracting(false); setError("Please upload a PDF or DOCX file."); return; }
    } catch { setExtracting(false); setError("Could not read file."); return; }
    setExtracting(false);
    if (!resumeText.trim()) { setError("Could not extract text. Make sure your file is not a scanned image."); return; }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const res = await fetch("/api/resume", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify({ text: resumeText, role: targetRole }) });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(parseResult(data.feedback));
    } catch { setError("Could not connect to server. Please try again."); }
    setLoading(false);
  }

  function handleDrop(e) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf" || f?.name.endsWith(".docx")) { setFile(f); setError(""); setResult(null); }
    else setError("Please upload a PDF or DOCX file.");
  }

  const fb = result;
  const roles = ["QA Engineer","Frontend Developer","Backend Developer","DevOps / SRE","Product Manager","Data Engineer / ML","Full Stack Developer","iOS Developer","Android Developer"];

  return (
    <Shell user={user} onLogout={onLogout}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "52px 5%" }}>
        <div style={styles.chip}>AI Resume Review</div>
        <h2 style={{ ...styles.h2, marginBottom: 6 }}>Check Your Resume</h2>
        <p style={{ color: GREY, marginBottom: 36, fontSize: 15 }}>Upload your PDF or DOCX resume and get instant AI feedback.</p>

        <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onClick={() => fileRef.current.click()}
          style={{ ...styles.card, border: `2px dashed ${dragging ? T : file ? T : TM}`, background: dragging ? TL : file ? TL : "white", cursor: "pointer", textAlign: "center", padding: "40px 24px", transition: "all .2s" }}>
          <input ref={fileRef} type="file" accept=".pdf,.docx" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) { setFile(f); setError(""); setResult(null); } }} />
          <div style={{ marginBottom: 12 }}>
            {file ? <span style={{ fontSize: 48 }}>📄</span> : <img src="/upload.png" alt="upload" style={{ width: 52, height: 52, objectFit: "contain" }} />}
          </div>
          {file
            ? <><div style={{ fontWeight: 700, color: DARK, fontSize: 15, marginBottom: 4 }}>{file.name}</div><div style={{ color: GREY, fontSize: 13 }}>{(file.size / 1024).toFixed(0)} KB · Click to change</div></>
            : <><div style={{ fontWeight: 700, color: DARK, fontSize: 15, marginBottom: 4 }}>Drop your resume here or click to upload</div><div style={{ color: GREY, fontSize: 13 }}>PDF or DOCX · Max 5MB</div></>
          }
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={{ fontWeight: 700, fontSize: 14, color: DARK, display: "block", marginBottom: 8 }}>Target Role</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {roles.map(r => (
              <button key={r} onClick={() => setTargetRole(r)} style={{ padding: "8px 16px", borderRadius: 30, border: `1.5px solid ${targetRole === r ? T : TM}`, background: targetRole === r ? TL : "white", color: targetRole === r ? TD : GREY, fontWeight: targetRole === r ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {error && <div style={{ marginTop: 16, background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 12, padding: 14, color: "#b91c1c", fontSize: 14 }}>{error}</div>}

        <button className="btn-hover" style={{ ...styles.bigBtn, marginTop: 24, opacity: file ? 1 : 0.45 }} disabled={!file || loading || extracting} onClick={analyzeResume}>
          {extracting ? "Reading file..." : loading ? "Analyzing..." : "🔍 Analyze Resume"}
        </button>

        {(loading || extracting) && (
          <div style={{ ...styles.card, textAlign: "center", padding: 48, marginTop: 32 }}>
            <img src="/elohire-robot.png" alt="AI" style={{ width: 64, height: 64, objectFit: "contain", marginBottom: 12, animation: "float 2s ease-in-out infinite" }} />
            <p style={{ color: TD, fontWeight: 700, fontSize: 15 }}>{extracting ? "Reading your file..." : "Analyzing your resume..."}</p>
            <Waveform active={true} color={T} />
          </div>
        )}

        {fb && (
          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn .5s ease" }}>
            <div style={{ ...styles.card, display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, textAlign: "center", padding: "8px 0" }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: T, lineHeight: 1 }}>{fb.score}<span style={{ fontSize: 18, color: GREY }}>/100</span></div>
                <div style={{ color: GREY, fontSize: 13, marginTop: 4 }}>Overall Score</div>
              </div>
              <div style={{ width: 1, background: TM }} />
              <div style={{ flex: 1, textAlign: "center", padding: "8px 0" }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: TD, lineHeight: 1 }}>{fb.ats}<span style={{ fontSize: 18, color: GREY }}>/100</span></div>
                <div style={{ color: GREY, fontSize: 13, marginTop: 4 }}>ATS Score</div>
              </div>
            </div>
            {fb.summary   && <FBCard iconImg="/verdict.png" title="Summary"          text={fb.summary}   color={T}       />}
            {fb.strengths && <FBCard iconImg="/strengths.png" title="Strengths"        text={fb.strengths} color="#22c55e" />}
            {fb.improve   && <FBCard iconImg="/improve-areas.png" title="Improvements"     text={fb.improve}   color="#f59e0b" />}
            {fb.ats_tips  && <FBCard iconImg="/typs-for-next-time.png" title="ATS Optimization" text={fb.ats_tips}  color={TD}      />}
            {fb.missing   && <FBCard iconImg="/improve-areas.png" title="Missing Sections" text={fb.missing}   color="#ef4444" />}
            {fb.verdict   && <FBCard iconImg="/verdict.png" title="Next Steps"       text={fb.verdict}   color={T}       />}
            <button className="btn-hover" style={{ ...styles.bigBtn, alignSelf: "flex-start" }} onClick={() => { setFile(null); setResult(null); }}>
              Check Another Resume
            </button>
          </div>
        )}
      </div>
    </Shell>
  );
}
