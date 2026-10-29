"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AlertCircle, CheckCircle, Lock } from "lucide-react";

import { apiRequest } from "@/lib/api";

const MIN_PASSWORD_LENGTH = 8;

// Completes a customer password reset using the token from the emailed link
// (/reset-password?token=...).
export default function ResetPasswordView() {
  const token = useSearchParams().get("token")?.trim() ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest("/auth/customer/password/save/", {
        method: "POST",
        body: { token, new_password: newPassword, confirm_password: confirmPassword },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset your password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="min-h-screen bg-zinc-50 px-6 py-20">
      <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <Lock className="h-6 w-6 text-danger" />
          <h1 className="text-xl font-bold text-zinc-900">Choose a new password</h1>
        </div>

        {!token && (
          <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            This reset link is missing its token. Request a new link from the login page.
          </p>
        )}

        {done && (
          <div className="space-y-4">
            <p className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              Your password has been reset.
            </p>
            <Link href="/customer" className="inline-block rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white">
              Sign in
            </Link>
          </div>
        )}

        {token && !done && (
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            )}
            <input
              type="password"
              autoComplete="new-password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5"
              required
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-danger px-4 py-2.5 font-medium text-white hover:brightness-95 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
