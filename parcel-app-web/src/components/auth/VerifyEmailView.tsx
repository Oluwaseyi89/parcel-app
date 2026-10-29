"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle } from "lucide-react";

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
    : "This link is invalid or has expired. Sign in to request a new verification email, or register again.";

  return (
    <section className="min-h-screen bg-zinc-50 px-6 py-20">
      <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        {verified ? <CheckCircle className="mx-auto h-12 w-12 text-green-600" /> : <AlertCircle className="mx-auto h-12 w-12 text-danger" />}
        <h1 className="mt-4 text-xl font-bold text-zinc-900">{title}</h1>
        <p className="mt-2 text-sm text-zinc-600">{body}</p>
        <Link href={LOGIN_PATH[role]} className="mt-6 inline-block rounded-lg bg-danger px-5 py-2.5 text-sm font-medium text-white hover:brightness-95">
          Go to sign in
        </Link>
      </div>
    </section>
  );
}
