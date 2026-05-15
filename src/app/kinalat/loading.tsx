export default function Loading() {
  return (
    <div className="container" style={{ padding: "48px 0 64px" }}>
      {/* page header skeleton */}
      <div style={{ height: 28, width: 180, background: "#e5e2da", borderRadius: 6, marginBottom: 8 }} />
      <div style={{ height: 38, width: 320, background: "#e5e2da", borderRadius: 6, marginBottom: 32 }} />
      {/* card grid skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 320,
              background: "#ede9e0",
              borderRadius: 8,
              animation: `kpulse-sk ${0.9 + (i % 3) * 0.15}s ease-in-out infinite alternate`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes kpulse-sk {
          from { opacity: 1; }
          to   { opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}
