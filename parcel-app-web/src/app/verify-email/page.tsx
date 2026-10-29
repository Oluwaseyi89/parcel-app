import { Suspense } from "react";

import VerifyEmailView from "@/components/auth/VerifyEmailView";

export default function VerifyEmailPage() {
  // useSearchParams needs a Suspense boundary for the page to be prerendered.
  return (
    <Suspense fallback={null}>
      <VerifyEmailView />
    </Suspense>
  );
}
