"use client";

import { useRef, type ReactNode } from "react";
import { track } from "@/lib/track";

/** Wraps the gallery area. On first interaction (click/tap), fires a gallery_open event. */
export function TrackGalleryOpen({
  modelId,
  modelSlug,
  children,
}: {
  modelId: string;
  modelSlug: string;
  children: ReactNode;
}) {
  const fired = useRef(false);

  function handleInteract() {
    if (fired.current) return;
    fired.current = true;
    track({ type: "gallery_open", model_id: modelId, model_slug: modelSlug });
  }

  return (
    <div onClick={handleInteract} onKeyDown={handleInteract}>
      {children}
    </div>
  );
}
