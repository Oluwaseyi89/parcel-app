import { Suspense } from "react";

import ResetPasswordView from "@/components/auth/ResetPasswordView";

export default function ResetPasswordPage() {
  // useSearchParams needs a Suspense boundary for the page to be prerendered.
  return (
    <Suspense fallback={null}>
      <ResetPasswordView />
    </Suspense>
  );
}
