"use client";

// Fire-and-forget analytics beacon — zero impact on UX.
// Uses sendBeacon so it survives page unload.

type TrackPayload = {
  type: string;
  model_id?: string;
  model_slug?: string;
  param?: string;
  val?: string;
};

export function track(payload: TrackPayload): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/track",
        new Blob([body], { type: "application/json" }),
      );
    } else {
      fetch("/api/track", {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
  } catch {}
}
