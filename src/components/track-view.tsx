"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/track";

/** Fires a model_view event once on mount. Renders nothing. */
export function TrackView({
  modelId,
  modelSlug,
}: {
  modelId: string;
  modelSlug: string;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track({ type: "model_view", model_id: modelId, model_slug: modelSlug });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
