"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

import { apiRequest } from "@/lib/api";

type Role = "customer" | "vendor" | "courier";

const LOGIN_PATH: Record<Role, string> = {
  customer: "/customer",
  vendor: "/vendor",
  courier: "/courier",
};

// Landing page for emailed activation links. The API verifies the account and redirects here with
// ?status=success|already-verified|invalid&role=customer|vendor|courier.
export default function VerifyEmailView() {
  const params = useSearchParams();
  const status = params.get("status");
  const roleParam = params.get("role");
  const role: Role = roleParam === "vendor" || roleParam === "courier" ? roleParam : "customer";
  const needsApproval = role !== "customer";

  const verified = status === "success" || status === "already-verified";
  const title = status === "success" ? "Email verified" : status === "already-verified" ? "Email already verified" : "Verification link invalid";
  const body = verified
    ? needsApproval
      ? "Your email is confirmed. An admin will review your account; you can sign in once it is approved."
      : "Your email is confirmed. You can now sign in."
    : "This link is invalid or has expired. Enter your email below and we'll send you a new one.";

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  async function resend(event: React.FormEvent) {
    event.preventDefault();
    setResendMessage("");
    setResendError("");
    setSending(true);
    try {
      const response = await apiRequest<{ message?: string }>("/auth/resend-activation/", {
        method: "POST",
        body: { email: email.trim(), role },
      });
      setResendMessage(response?.message ?? "If that account still needs verifying, a new link has been sent.");
    } catch (err) {
      setResendError(err instanceof Error ? err.message : "Unable to send a new link right now.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="min-h-screen bg-zinc-50 px-6 py-20">
      <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        {verified ? <CheckCircle className="mx-auto h-12 w-12 text-green-600" /> : <AlertCircle className="mx-auto h-12 w-12 text-danger" />}
        <h1 className="mt-4 text-xl font-bold text-zinc-900">{title}</h1>
        <p className="mt-2 text-sm text-zinc-600">{body}</p>
        {!verified && (
          <form onSubmit={resend} className="mt-6 space-y-3 text-left">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Your account email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5"
            />
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-lg border border-danger px-4 py-2.5 text-sm font-medium text-danger hover:bg-red-50 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send me a new link"}
            </button>
            {resendMessage && <p className="text-sm text-green-700">{resendMessage}</p>}
            {resendError && <p className="text-sm text-red-700">{resendError}</p>}
          </form>
        )}
        <Link href={LOGIN_PATH[role]} className="mt-6 inline-block rounded-lg bg-danger px-5 py-2.5 text-sm font-medium text-white hover:brightness-95">
          Go to sign in
        </Link>
      </div>
    </section>
  );
}
