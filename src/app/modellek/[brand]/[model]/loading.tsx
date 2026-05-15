export default function Loading() {
  return (
    <div className="container" style={{ padding: "40px 0 64px" }}>
      {/* model name + price area */}
      <div style={{ height: 44, width: 280, background: "#e5e2da", borderRadius: 6, marginBottom: 12 }} />
      <div style={{ height: 26, width: 180, background: "#e5e2da", borderRadius: 6, marginBottom: 32 }} />
      {/* hero image skeleton */}
      <div
        style={{
          width: "100%",
          aspectRatio: "16/7",
          background: "#ede9e0",
          borderRadius: 8,
          marginBottom: 32,
          animation: "kpulse-sk 1.1s ease-in-out infinite alternate",
        }}
      />
      {/* spec rows */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 18,
            width: `${60 + (i * 7) % 30}%`,
            background: "#e5e2da",
            borderRadius: 4,
            marginBottom: 12,
          }}
        />
      ))}
      <style>{`
        @keyframes kpulse-sk {
          from { opacity: 1; }
          to   { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
