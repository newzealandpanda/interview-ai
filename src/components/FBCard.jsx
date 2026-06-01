import { TM, DARK, GREY } from "../constants.js";

export default function FBCard({ icon, iconImg, title, text, color }) {
  return (
    <div style={{ background: "white", border: `1.5px solid ${TM}`, borderLeft: `4px solid ${color}`, borderRadius: 20, padding: 22 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: DARK, marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
        {iconImg
          ? <img src={iconImg} alt="" style={{ width: 56, height: 56, objectFit: "contain", flexShrink: 0 }} />
          : <span>{icon}</span>
        }
        {title}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.75, color: GREY, whiteSpace: "pre-line" }}>{text}</div>
    </div>
  );
}
