"use client";

import { OPEN_TUTORIAL_EVENT } from "./tutorial";

/** Footer/inline trigger that re-opens the onboarding tutorial. */
export function TutorialLink({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="foot-link-btn"
      onClick={() => window.dispatchEvent(new Event(OPEN_TUTORIAL_EVENT))}
    >
      {children}
    </button>
  );
}
