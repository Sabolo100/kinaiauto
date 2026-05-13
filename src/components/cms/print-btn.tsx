"use client";

export function PrintBtn() {
  return (
    <button
      type="button"
      className="cms-btn primary no-print"
      onClick={() => window.print()}
    >
      ⎙ Nyomtatás / PDF mentés
    </button>
  );
}
