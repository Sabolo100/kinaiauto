// Tutorial uses useSearchParams (to detect ad arrivals), which requires a
// Suspense boundary in the App Router.
import { Suspense } from "react";
import { Tutorial } from "./tutorial";

export function TutorialWrapper() {
  return (
    <Suspense fallback={null}>
      <Tutorial />
    </Suspense>
  );
}
