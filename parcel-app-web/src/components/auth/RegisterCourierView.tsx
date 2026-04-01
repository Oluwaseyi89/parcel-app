"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Package, User } from "lucide-react";

import { apiForm } from "@/lib/api";

interface ApiResponse {
  status?: string;
  data?: string;
}

interface CourierForm {
  first_name: string;
  last_name: string;
  bus_country: string;
  bus_state: string;
  bus_street: string;
  cac_reg_no: string;
  nin: string;
  phone_no: string;
  email: string;
  password: string;
  cour_policy: boolean;
}

const initialForm: CourierForm = {
  first_name: "",
  last_name: "",
  bus_country: "",
  bus_state: "",
  bus_street: "",
  cac_reg_no: "",
  nin: "",
  phone_no: "",
  email: "",
  password: "",
  cour_policy: false,
};

export default function RegisterCourierView() {
  const [form, setForm] = useState<CourierForm>(initialForm);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);

  function setField<K extends keyof CourierForm>(key: K, value: CourierForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!photo) {
      setErrorMessage("Courier photo is required.");
      return;
    }

    if (form.password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      body.append("first_name", form.first_name);
      body.append("last_name", form.last_name);
      body.append("bus_country", form.bus_country);
      body.append("bus_state", form.bus_state);
      body.append("bus_street", form.bus_street);
      body.append("cac_reg_no", form.cac_reg_no);
      body.append("nin", form.nin);
      body.append("phone_no", form.phone_no);
      body.append("email", form.email);
      body.append("password", form.password);
      body.append("cour_photo", photo, photo.name);
      body.append("cour_policy", String(form.cour_policy));
      body.append("reg_date", new Date().toISOString());
      body.append("is_email_verified", "false");

      const response = await apiForm<ApiResponse>("/parcel_backends/reg_temp_cour/", "POST", body);
      if (response.status === "success") {
        setSuccessMessage(String(response.data ?? "Courier registration submitted."));
        setForm(initialForm);
        setConfirmPassword("");
        setPhoto(null);
      } else {
        setErrorMessage(String(response.data ?? "Unable to submit registration."));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to submit registration.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="min-h-screen bg-zinc-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-danger">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900">Courier Registration</h1>
          <p className="mt-2 text-sm text-zinc-600">Join the delivery network and start earning</p>
        </div>

        {errorMessage && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>}
        {successMessage && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              Upload Photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="hidden" />
            <div className="h-24 w-24 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
              {photo ? <img src={URL.createObjectURL(photo)} alt="courier" className="h-full w-full object-cover" /> : <User className="m-auto mt-6 h-12 w-12 text-zinc-400" />}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input placeholder="First Name" value={form.first_name} onChange={(e) => setField("first_name", e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2.5" required />
            <input placeholder="Last Name" value={form.last_name} onChange={(e) => setField("last_name", e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2.5" required />
            <input placeholder="NIN" value={form.nin} onChange={(e) => setField("nin", e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2.5" required />
            <input placeholder="Phone Number" value={form.phone_no} onChange={(e) => setField("phone_no", e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2.5" required />
            <input placeholder="CAC Registration Number" value={form.cac_reg_no} onChange={(e) => setField("cac_reg_no", e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2.5" required />
            <input placeholder="Operating Country" value={form.bus_country} onChange={(e) => setField("bus_country", e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2.5" required />
            <input placeholder="Operating State" value={form.bus_state} onChange={(e) => setField("bus_state", e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2.5" required />
            <input placeholder="Business Street" value={form.bus_street} onChange={(e) => setField("bus_street", e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2.5 md:col-span-2" required />
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => setField("email", e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2.5" required />
            <input type="password" placeholder="Password" value={form.password} onChange={(e) => setField("password", e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2.5" required />
            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2.5" required />
            <label className="flex items-center gap-2 text-sm text-zinc-700 md:col-span-2">
              <input type="checkbox" checked={form.cour_policy} onChange={(e) => setField("cour_policy", e.target.checked)} />
              I accept courier terms and policy.
            </label>
          </div>

          <button type="submit" disabled={submitting} className={`mt-6 w-full rounded-lg px-4 py-2.5 font-medium text-white ${submitting ? "bg-zinc-400" : "bg-danger hover:brightness-95"}`}>
            {submitting ? "Submitting..." : "Register as Courier"}
          </button>

          <p className="mt-4 text-center text-sm text-zinc-600">
            Already have an account? <Link href="/courier" className="font-medium text-danger hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
