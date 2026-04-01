"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle, Lock, Mail, Package, User, UserPlus } from "lucide-react";

import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/authStore";
import { normalizeApiError, validateEmail } from "@/lib/validation";
import type { User as AppUser } from "@/lib/types";

type Role = "customer" | "vendor" | "courier";

interface RoleConfig {
  title: string;
  subtitle: string;
  registerPath: string;
  registerLabel: string;
  loginPath: string;
  resetPath: string;
  dashboardPath: string;
}

const ROLE_CONFIG: Record<Role, RoleConfig> = {
  customer: {
    title: "Customer Login",
    subtitle: "Access your customer dashboard",
    registerPath: "/register-customer",
    registerLabel: "Register as Customer",
    loginPath: "/parcel_customer/customer_login/",
    resetPath: "/parcel_customer/customer_resetter/",
    dashboardPath: "/customer-dash",
  },
  vendor: {
    title: "Vendor Login",
    subtitle: "Access your vendor dashboard",
    registerPath: "/register-vendor",
    registerLabel: "Register as Vendor",
    loginPath: "/parcel_backends/vendor_login/",
    resetPath: "/parcel_backends/vendor_resetter/",
    dashboardPath: "/vendor-dash",
  },
  courier: {
    title: "Courier Login",
    subtitle: "Access your courier dashboard",
    registerPath: "/register-courier",
    registerLabel: "Register as Courier",
    loginPath: "/parcel_backends/courier_login/",
    resetPath: "/parcel_backends/courier_resetter/",
    dashboardPath: "/courier-dash",
  },
};

interface AuthResponse {
  status?: string;
  data?: AppUser | string;
}

function normalizeError(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return "An unexpected error occurred.";
}

export default function RoleLoginView({ role }: { role: Role }) {
  const router = useRouter();
  const auth = useAuthStore();
  const config = useMemo(() => ROLE_CONFIG[role], [role]);

  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [resetEmail, setResetEmail] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const Icon = role === "customer" ? User : role === "vendor" ? UserPlus : Package;

  function clearAlerts() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  function setRoleSession(user: AppUser) {
    if (role === "customer") {
      auth.loginCustomer(user);
      return;
    }
    if (role === "vendor") {
      auth.loginVendor(user);
      return;
    }
    auth.loginCourier(user);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    clearAlerts();

    if (!credentials.email || !credentials.password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    const emailError = validateEmail(credentials.email);
    if (emailError) {
      setErrorMessage(emailError.message);
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiRequest<AuthResponse>(config.loginPath, {
        method: "POST",
        body: credentials as unknown as Record<string, unknown>,
        json: true,
      });

      const data = response.data;
      if (data && typeof data === "object" && data.email === credentials.email) {
        setRoleSession(data);
        router.push(config.dashboardPath);
        return;
      }

      // Check for specific error conditions
      if (response.status === "password-error") {
        setShowReset(true);
        setErrorMessage("Incorrect password. You can reset your password below.");
        return;
      }

      if (response.status === "not-found" || typeof data === "string" && data.toLowerCase().includes("not found")) {
        setErrorMessage("Account not found. Please check your email or register a new account.");
        return;
      }

      setErrorMessage(typeof data === "string" ? data : "Login failed. Please check your credentials and try again.");
    } catch (error) {
      setErrorMessage(normalizeApiError(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();
    clearAlerts();

    if (!resetEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    const emailError = validateEmail(resetEmail);
    if (emailError) {
      setErrorMessage(emailError.message);
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiRequest<AuthResponse>(config.resetPath, {
        method: "POST",
        body: { email: resetEmail } as Record<string, unknown>,
        json: true,
      });
      if (response.status === "success") {
        setSuccessMessage(String(response.data ?? "Password reset request sent. Check your email for instructions."));
        setShowReset(false);
        setResetEmail("");
      } else {
        setErrorMessage(String(response.data ?? "Unable to process password reset. Please try again."));
      }
    } catch (error) {
      setErrorMessage(normalizeApiError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="min-h-screen bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger">
            <Icon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900">{config.title}</h1>
          <p className="mt-2 text-sm text-zinc-600">{config.subtitle}</p>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Email Address</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
              <input
                name="email"
                type="email"
                value={credentials.email}
                onChange={(e) => {
                  setCredentials((prev) => ({ ...prev, email: e.target.value }));
                  setShowReset(false);
                }}
                className="w-full rounded-lg border border-zinc-300 py-2.5 pl-9 pr-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
              <input
                name="password"
                type="password"
                value={credentials.password}
                onChange={(e) => {
                  setCredentials((prev) => ({ ...prev, password: e.target.value }));
                  setShowReset(false);
                }}
                className="w-full rounded-lg border border-zinc-300 py-2.5 pl-9 pr-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowReset((prev) => !prev)}
            className="text-sm font-medium text-danger hover:underline"
          >
            Forgot your password?
          </button>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition ${
              submitting ? "cursor-not-allowed bg-zinc-400" : "bg-danger hover:brightness-95"
            }`}
          >
            {submitting ? "Signing in..." : "Sign in to Dashboard"}
          </button>

          <p className="text-center text-sm text-zinc-600">
            Do not have an account?{" "}
            <Link href={config.registerPath} className="font-medium text-danger hover:underline">
              {config.registerLabel}
            </Link>
          </p>
        </form>

        {showReset && (
          <form onSubmit={handleResetPassword} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-800">Reset Password</h2>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger"
              placeholder="Your registered email"
            />
            <div className="grid grid-cols-2 gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-danger px-4 py-2.5 text-sm font-medium text-white hover:brightness-95"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
