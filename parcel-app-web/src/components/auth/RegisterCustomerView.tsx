"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, CheckCircle, Lock, Mail, MapPin, Phone, User } from "lucide-react";

import { apiRequest } from "@/lib/api";

interface CustomerPayload {
  first_name: string;
  last_name: string;
  country: string;
  state: string;
  street: string;
  phone_no: string;
  email: string;
  password: string;
  reg_date: string;
  is_email_verified: boolean;
}

interface ApiResponse {
  status?: string;
  data?: string;
}

const initialState: CustomerPayload = {
  first_name: "",
  last_name: "",
  country: "",
  state: "",
  street: "",
  phone_no: "",
  email: "",
  password: "",
  reg_date: new Date().toISOString(),
  is_email_verified: false,
};

export default function RegisterCustomerView() {
  const [form, setForm] = useState<CustomerPayload>(initialState);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function setField<K extends keyof CustomerPayload>(key: K, value: CustomerPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function clearAlerts() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    clearAlerts();

    if (form.password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiRequest<ApiResponse>("/parcel_customer/reg_customer/", {
        method: "POST",
        body: form as unknown as Record<string, unknown>,
        json: true,
      });

      if (response.status === "success") {
        setSuccessMessage(String(response.data ?? "Registration completed."));
        setForm({ ...initialState, reg_date: new Date().toISOString() });
        setConfirmPassword("");
      } else {
        setErrorMessage(String(response.data ?? "Registration failed."));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="min-h-screen bg-zinc-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-danger">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900">Customer Registration</h1>
          <p className="mt-2 text-sm text-zinc-600">Create your account to start shopping</p>
        </div>

        {errorMessage && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input value={form.first_name} onChange={(e) => setField("first_name", e.target.value)} placeholder="First Name" className="rounded-lg border border-zinc-300 px-3 py-2.5 focus:ring-2 focus:ring-danger focus:outline-none" required />
            <input value={form.last_name} onChange={(e) => setField("last_name", e.target.value)} placeholder="Last Name" className="rounded-lg border border-zinc-300 px-3 py-2.5 focus:ring-2 focus:ring-danger focus:outline-none" required />
            <input value={form.phone_no} onChange={(e) => setField("phone_no", e.target.value)} placeholder="Phone Number" className="rounded-lg border border-zinc-300 px-3 py-2.5 focus:ring-2 focus:ring-danger focus:outline-none" required />
            <input value={form.country} onChange={(e) => setField("country", e.target.value)} placeholder="Country" className="rounded-lg border border-zinc-300 px-3 py-2.5 focus:ring-2 focus:ring-danger focus:outline-none" required />
            <input value={form.state} onChange={(e) => setField("state", e.target.value)} placeholder="State" className="rounded-lg border border-zinc-300 px-3 py-2.5 focus:ring-2 focus:ring-danger focus:outline-none" required />
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <input value={form.email} onChange={(e) => setField("email", e.target.value)} type="email" placeholder="Email" className="w-full rounded-lg border border-zinc-300 py-2.5 pl-9 pr-3 focus:ring-2 focus:ring-danger focus:outline-none" required />
            </div>
            <div className="relative md:col-span-2">
              <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <input value={form.street} onChange={(e) => setField("street", e.target.value)} placeholder="Street Address" className="w-full rounded-lg border border-zinc-300 py-2.5 pl-9 pr-3 focus:ring-2 focus:ring-danger focus:outline-none" required />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <input value={form.password} onChange={(e) => setField("password", e.target.value)} type="password" placeholder="Password" className="w-full rounded-lg border border-zinc-300 py-2.5 pl-9 pr-3 focus:ring-2 focus:ring-danger focus:outline-none" required />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="Confirm Password" className="w-full rounded-lg border border-zinc-300 py-2.5 pl-9 pr-3 focus:ring-2 focus:ring-danger focus:outline-none" required />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`mt-6 w-full rounded-lg px-4 py-2.5 font-medium text-white ${submitting ? "bg-zinc-400" : "bg-danger hover:brightness-95"}`}
          >
            {submitting ? "Submitting..." : "Register as Customer"}
          </button>

          <p className="mt-4 text-center text-sm text-zinc-600">
            Already have an account? <Link href="/customer" className="font-medium text-danger hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
