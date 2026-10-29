"use client";

import { useState } from "react";

import { DashboardFeedback } from "@/components/dashboard/DashboardUi";
import { apiRequest } from "@/lib/api";
import { usePaginatedList } from "@/lib/hooks/usePaginatedList";
import type { ShippingAddress } from "@/lib/types/backend";

type AddressForm = Omit<ShippingAddress, "id">;

const FIELDS: Array<{ key: keyof AddressForm; label: string; required: boolean }> = [
  { key: "full_name", label: "Full name", required: true },
  { key: "phone", label: "Phone", required: true },
  { key: "email", label: "Email", required: true },
  { key: "street_address", label: "Street address", required: true },
  { key: "apartment", label: "Apartment / suite", required: false },
  { key: "city", label: "City", required: true },
  { key: "state", label: "State", required: true },
  { key: "country", label: "Country", required: true },
  { key: "postal_code", label: "Postal code", required: true },
];

export default function ShippingAddressesPanel({ defaultEmail = "" }: { defaultEmail?: string }) {
  const emptyForm: AddressForm = {
    full_name: "", phone: "", email: defaultEmail, street_address: "", apartment: "",
    city: "", state: "", country: "Nigeria", postal_code: "", is_default: false,
  };
  const { items, isLoading, error, reload } = usePaginatedList<ShippingAddress>("/order/shipping-addresses/", 50);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function addAddress(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setFormError("");
    setSaving(true);
    try {
      await apiRequest("/order/shipping-addresses/", { method: "POST", body: { ...form } });
      setMessage("Address saved.");
      setForm(emptyForm);
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to save the address.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <DashboardFeedback message={message} error={error || formError} isLoading={isLoading} />
      {!isLoading && !error && items.length === 0 && <p className="text-sm text-zinc-500">No saved addresses yet.</p>}
      {items.map((address) => (
        <div key={address.id} className="rounded-lg border border-zinc-200 p-4 text-sm text-zinc-700">
          <p className="font-medium text-zinc-900">
            {address.full_name} {address.is_default && <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs">Default</span>}
          </p>
          <p>{[address.street_address, address.apartment].filter(Boolean).join(", ")}</p>
          <p>{[address.city, address.state, address.postal_code, address.country].filter(Boolean).join(", ")}</p>
          <p>{address.phone} · {address.email}</p>
        </div>
      ))}

      <form onSubmit={addAddress} className="space-y-3 rounded-lg border border-zinc-200 p-4">
        <p className="font-medium text-zinc-900">Add an address</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <input
              key={field.key}
              required={field.required}
              type={field.key === "email" ? "email" : "text"}
              placeholder={field.label}
              value={String(form[field.key] ?? "")}
              onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
          ))}
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" checked={Boolean(form.is_default)} onChange={(e) => setForm((prev) => ({ ...prev, is_default: e.target.checked }))} />
          Use as my default address
        </label>
        <div>
          <button type="submit" disabled={saving} className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:brightness-95 disabled:opacity-50">
            {saving ? "Saving…" : "Save address"}
          </button>
        </div>
      </form>
    </div>
  );
}
