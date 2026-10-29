"use client";

import { useEffect, useState } from "react";

import { DashboardFeedback } from "@/components/dashboard/DashboardUi";
import { apiRequest } from "@/lib/api";

// Statuses a courier may set themselves; suspension/deactivation are admin decisions.
const SELF_STATUSES = [
  { value: "active", label: "Available for deliveries" },
  { value: "offline", label: "Offline" },
  { value: "on_delivery", label: "On a delivery" },
];

interface CourierProfile {
  status?: string;
  current_latitude?: string | null;
  current_longitude?: string | null;
}

export default function CourierAvailabilityPanel() {
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState<{ lat: string; lng: string } | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiRequest<{ data?: CourierProfile }>("/couriers/profile/")
      .then((res) => {
        setStatus(res.data?.status ?? "");
        if (res.data?.current_latitude && res.data?.current_longitude) {
          setLocation({ lat: res.data.current_latitude, lng: res.data.current_longitude });
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load your status."));
  }, []);

  async function updateStatus(next: string) {
    setMessage("");
    setError("");
    setBusy(true);
    try {
      await apiRequest("/couriers/status/update/", { method: "POST", body: { status: next } });
      setStatus(next);
      setMessage("Status updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update your status.");
    } finally {
      setBusy(false);
    }
  }

  function shareLocation() {
    setMessage("");
    setError("");
    if (!("geolocation" in navigator)) {
      setError("Location is not available in this browser.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // The API stores coordinates with 6 decimal places.
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        try {
          await apiRequest("/couriers/location/update/", { method: "POST", body: { latitude: lat, longitude: lng } });
          setLocation({ lat, lng });
          setMessage("Location shared.");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unable to share your location.");
        } finally {
          setBusy(false);
        }
      },
      () => {
        setError("Location permission was denied.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  return (
    <div className="space-y-5">
      <DashboardFeedback message={message} error={error} />
      <div className="space-y-2">
        <p className="font-medium text-zinc-900">Availability</p>
        <div className="flex flex-wrap gap-2">
          {SELF_STATUSES.map((option) => (
            <button
              key={option.value}
              disabled={busy || status === option.value}
              onClick={() => updateStatus(option.value)}
              className={`rounded-full px-3 py-1 text-sm ${status === option.value ? "bg-danger text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"} disabled:cursor-default`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {status && !SELF_STATUSES.some((option) => option.value === status) && (
          <p className="text-sm text-zinc-600">Your account status is “{status}”. Contact support to change it.</p>
        )}
      </div>
      <div className="space-y-2">
        <p className="font-medium text-zinc-900">Location</p>
        <p className="text-sm text-zinc-600">
          {location ? `Last shared: ${location.lat}, ${location.lng}` : "You have not shared a location yet."}
        </p>
        <button onClick={shareLocation} disabled={busy} className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:brightness-95 disabled:opacity-50">
          Share my current location
        </button>
      </div>
    </div>
  );
}
