// Server-safe wrapper — WelcomePopup uses useSearchParams which requires
// a Suspense boundary. This wrapper provides it so layout.tsx stays clean.
import { Suspense } from "react";
import { WelcomePopup } from "./welcome-popup";

export function WelcomePopupWrapper() {
  return (
    <Suspense fallback={null}>
      <WelcomePopup />
    </Suspense>
  );
}
