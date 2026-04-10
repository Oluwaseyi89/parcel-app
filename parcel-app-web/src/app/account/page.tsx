"use client";

import Link from "next/link";
import { ArrowRight, Truck, Store, User } from "lucide-react";

type RoleOption = {
  role: "customer" | "vendor" | "courier";
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  loginPath: string;
  signupPath: string;
};

const roleOptions: RoleOption[] = [
  {
    role: "customer",
    label: "Customer",
    description: "Shop products, place orders, and track deliveries.",
    icon: User,
    loginPath: "/customer",
    signupPath: "/register-customer",
  },
  {
    role: "vendor",
    label: "Vendor",
    description: "List products, manage deals, and monitor sales.",
    icon: Store,
    loginPath: "/vendor",
    signupPath: "/register-vendor",
  },
  {
    role: "courier",
    label: "Courier",
    description: "Handle dispatches, deliveries, and payout tracking.",
    icon: Truck,
    loginPath: "/courier",
    signupPath: "/register-courier",
  },
];

export default function AccountPage() {
  return (
    <section className="min-h-screen bg-zinc-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-zinc-900">Login</h1>
          <p className="mt-2 text-sm text-zinc-600">Pick your role to continue. If you do not have an account yet, use the sign up link in the role card.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {roleOptions.map((option) => {
            const Icon = option.icon;

            return (
              <div key={option.role} className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-zinc-900">{option.label}</h2>
                <p className="mt-2 text-sm text-zinc-600">{option.description}</p>

                <Link href={option.loginPath} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-rose-700">
                  Continue to login
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>

                <p className="mt-3 text-xs text-zinc-500">
                  No account?{" "}
                  <Link href={option.signupPath} className="font-medium text-rose-700 hover:underline">
                    Sign up as {option.label}
                  </Link>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
