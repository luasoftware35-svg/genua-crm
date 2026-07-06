"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: "24px",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Kritik hata</h1>
        <p style={{ color: "#666", marginBottom: "16px", textAlign: "center" }}>
          {error.message || "Uygulama yüklenemedi."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            cursor: "pointer",
            background: "#fff",
          }}
        >
          Tekrar Dene
        </button>
      </body>
    </html>
  );
}
