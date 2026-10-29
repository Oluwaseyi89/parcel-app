"use client";

import { useEffect, useState } from "react";

import { DashboardFeedback } from "@/components/dashboard/DashboardUi";
import { apiRequest } from "@/lib/api";
import type { DashboardRole } from "@/lib/types/backend";

const PROFILE_PATH: Record<DashboardRole, string> = {
  customer: "/auth/customer/profile/",
  vendor: "/vendors/profile/",
  courier: "/couriers/profile/",
};

const COMMON_FIELDS: Array<[string, string]> = [
  ["first_name", "First name"],
  ["last_name", "Last name"],
  ["email", "Email"],
  ["phone", "Phone"],
];

const ROLE_FIELDS: Record<DashboardRole, Array<[string, string]>> = {
  customer: [["street", "Street"], ["state", "State"], ["country", "Country"], ["is_email_verified", "Email verified"]],
  vendor: [
    ["business_name", "Business name"], ["business_category", "Category"], ["business_street", "Business address"],
    ["business_state", "State"], ["business_country", "Country"], ["approval_status", "Approval"], ["status", "Account status"],
  ],
  courier: [
    ["vehicle_type", "Vehicle"], ["vehicle_registration", "Registration"], ["service_area", "Service area"],
    ["approval_status", "Approval"], ["status", "Account status"], ["total_deliveries", "Total deliveries"],
    ["delivery_success_rate", "Success rate (%)"], ["rating", "Rating"],
  ],
};

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value).replace(/_/g, " ");
}

export default function ProfilePanel({ role }: { role: DashboardRole }) {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<{ data?: Record<string, unknown> }>(PROFILE_PATH[role])
      .then((res) => setProfile(res.data ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load your profile."));
  }, [role]);

  const rejection = profile?.rejection_reason ? String(profile.rejection_reason) : "";

  return (
    <div className="space-y-4">
      <DashboardFeedback error={error} isLoading={!profile && !error} />
      {profile && (
        <>
          {rejection && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Reviewer note: {rejection}</div>
          )}
          <dl className="grid gap-3 sm:grid-cols-2">
            {[...COMMON_FIELDS, ...ROLE_FIELDS[role]].map(([key, label]) => (
              <div key={key} className="rounded-lg border border-zinc-200 p-3">
                <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
                <dd className="mt-1 text-sm text-zinc-900">{display(profile[key])}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-zinc-500">
            Member since {profile.created_at ? new Date(String(profile.created_at)).toLocaleDateString() : "—"}
          </p>
        </>
      )}
    </div>
  );
}
