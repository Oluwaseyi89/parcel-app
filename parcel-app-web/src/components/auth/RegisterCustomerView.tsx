"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, CheckCircle, Lock, Mail, MapPin, Phone, User } from "lucide-react";

import { apiRequest } from "@/lib/api";
import { normalizeApiError, validateEmail, validatePassword, validatePasswordMatch, validatePhone, validateRequired } from "@/lib/validation";

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function setField<K extends keyof CustomerPayload>(key: K, value: CustomerPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function clearAlerts() {
    setErrorMessage("");
    setSuccessMessage("");
    setFieldErrors({});
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    // Validate required fields
    if (!form.first_name.trim()) errors.first_name = "First name is required.";
    if (!form.last_name.trim()) errors.last_name = "Last name is required.";
    if (!form.country.trim()) errors.country = "Country is required.";
    if (!form.state.trim()) errors.state = "State is required.";
    if (!form.street.trim()) errors.street = "Street address is required.";

    // Validate email
    const emailErr = validateEmail(form.email);
    if (emailErr) errors[emailErr.field] = emailErr.message;

    // Validate phone
    const phoneErr = validatePhone(form.phone_no);
    if (phoneErr) errors[phoneErr.field] = phoneErr.message;

    // Validate password
    const paswordErr = validatePassword(form.password);
    if (paswordErr) errors[paswordErr.field] = paswordErr.message;

    // Validate password match
    const matchErr = validatePasswordMatch(form.password, confirmPassword);
    if (matchErr) errors[matchErr.field] = matchErr.message;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    clearAlerts();

    if (!validateForm()) {
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
        setSuccessMessage(String(response.data ?? "Registration completed successfully! You can now log in."));
        setForm({ ...initialState, reg_date: new Date().toISOString() });
        setConfirmPassword("");
      } else {
        setErrorMessage(String(response.data ?? "Registration failed. Please try again."));
      }
    } catch (error) {
      setErrorMessage(normalizeApiError(error));
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* First Name */}
            <div>
              <input
                value={form.first_name}
                onChange={(e) => setField("first_name", e.target.value)}
                placeholder="First Name"
                className={`w-full rounded-lg border px-3 py-2.5 focus:ring-2 focus:outline-none ${fieldErrors.first_name ? "border-red-300 focus:ring-red-400" : "border-zinc-300 focus:ring-danger"}`}
              />
              {fieldErrors.first_name && <p className="mt-1 text-xs text-red-600">{fieldErrors.first_name}</p>}
            </div>

            {/* Last Name */}
            <div>
              <input
                value={form.last_name}
                onChange={(e) => setField("last_name", e.target.value)}
                placeholder="Last Name"
                className={`w-full rounded-lg border px-3 py-2.5 focus:ring-2 focus:outline-none ${fieldErrors.last_name ? "border-red-300 focus:ring-red-400" : "border-zinc-300 focus:ring-danger"}`}
              />
              {fieldErrors.last_name && <p className="mt-1 text-xs text-red-600">{fieldErrors.last_name}</p>}
            </div>

            {/* Phone */}
            <div>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <input
                  value={form.phone_no}
                  onChange={(e) => setField("phone_no", e.target.value)}
                  placeholder="Phone Number"
                  className={`w-full rounded-lg border pl-9 px-3 py-2.5 focus:ring-2 focus:outline-none ${fieldErrors.phone_no ? "border-red-300 focus:ring-red-400" : "border-zinc-300 focus:ring-danger"}`}
                />
              </div>
              {fieldErrors.phone_no && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone_no}</p>}
            </div>

            {/* Country */}
            <div>
              <input
                value={form.country}
                onChange={(e) => setField("country", e.target.value)}
                placeholder="Country"
                className={`w-full rounded-lg border px-3 py-2.5 focus:ring-2 focus:outline-none ${fieldErrors.country ? "border-red-300 focus:ring-red-400" : "border-zinc-300 focus:ring-danger"}`}
              />
              {fieldErrors.country && <p className="mt-1 text-xs text-red-600">{fieldErrors.country}</p>}
            </div>

            {/* State */}
            <div>
              <input
                value={form.state}
                onChange={(e) => setField("state", e.target.value)}
                placeholder="State"
                className={`w-full rounded-lg border px-3 py-2.5 focus:ring-2 focus:outline-none ${fieldErrors.state ? "border-red-300 focus:ring-red-400" : "border-zinc-300 focus:ring-danger"}`}
              />
              {fieldErrors.state && <p className="mt-1 text-xs text-red-600">{fieldErrors.state}</p>}
            </div>

            {/* Email */}
            <div>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <input
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  type="email"
                  placeholder="Email"
                  className={`w-full rounded-lg border pl-9 px-3 py-2.5 focus:ring-2 focus:outline-none ${fieldErrors.email ? "border-red-300 focus:ring-red-400" : "border-zinc-300 focus:ring-danger"}`}
                />
              </div>
              {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
            </div>

            {/* Street Address */}
            <div className="md:col-span-2">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <input
                  value={form.street}
                  onChange={(e) => setField("street", e.target.value)}
                  placeholder="Street Address"
                  className={`w-full rounded-lg border pl-9 px-3 py-2.5 focus:ring-2 focus:outline-none ${fieldErrors.street ? "border-red-300 focus:ring-red-400" : "border-zinc-300 focus:ring-danger"}`}
                />
              </div>
              {fieldErrors.street && <p className="mt-1 text-xs text-red-600">{fieldErrors.street}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <input
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  type="password"
                  placeholder="Password"
                  className={`w-full rounded-lg border pl-9 px-3 py-2.5 focus:ring-2 focus:outline-none ${fieldErrors.password ? "border-red-300 focus:ring-red-400" : "border-zinc-300 focus:ring-danger"}`}
                />
              </div>
              {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
              {!fieldErrors.password && form.password && <p className="mt-1 text-xs text-green-600">✓ Password is valid</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  placeholder="Confirm Password"
                  className={`w-full rounded-lg border pl-9 px-3 py-2.5 focus:ring-2 focus:outline-none ${fieldErrors.confirmPassword ? "border-red-300 focus:ring-red-400" : "border-zinc-300 focus:ring-danger"}`}
                />
              </div>
              {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>}
              {!fieldErrors.confirmPassword && confirmPassword && form.password === confirmPassword && <p className="mt-1 text-xs text-green-600">✓ Passwords match</p>}
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
            <p className="font-medium">Password Requirements:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>At least 8 characters long</li>
              <li>Mix of uppercase and lowercase letters</li>
              <li>At least one number</li>
            </ul>
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
