export default function Waveform({ active, color = "#45A29E" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 32 }}>
      {[...Array(7)].map((_, i) => (
        <div key={i} style={{
          width: 4, borderRadius: 99, background: color,
          height: active ? undefined : 6,
          animation: active ? "wave 1.1s ease-in-out infinite" : "none",
          animationDelay: `${i * 0.12}s`,
          minHeight: 4, maxHeight: 28,
        }} />
      ))}
    </div>
  );
}
