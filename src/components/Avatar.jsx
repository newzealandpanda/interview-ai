import { T, TM } from "../constants.js";

export default function Avatar({ url, name, size = 40 }) {
  const letter = name?.[0]?.toUpperCase() || "?";
  const fontSize = Math.round(size * 0.4);
  const borderWidth = Math.max(2, Math.round(size * 0.06));

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{
          width: size, height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: `${borderWidth}px solid ${T}`,
          flexShrink: 0,
          display: "block",
        }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size,
      borderRadius: "50%",
      background: `linear-gradient(135deg, ${T}, #2d7a76)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontSize, fontWeight: 800,
      flexShrink: 0,
    }}>
      {letter}
    </div>
  );
}
