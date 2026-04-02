"use client";

/**
 * Reusable UI components for dashboard modules.
 * Consolidates repeated error, message, and loading state UI patterns.
 */

export function DashboardMessage({ message }: { message: string }) {
  if (!message) return null;
  return <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>;
}

export function DashboardError({ error }: { error: string }) {
  if (!error) return null;
  return <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>;
}

export function DashboardLoading({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;
  return <p className="text-sm text-zinc-500">Loading data...</p>;
}

export function DashboardFeedback({
  message = "",
  error = "",
  isLoading = false,
}: {
  message?: string;
  error?: string;
  isLoading?: boolean;
}) {
  return (
    <>
      <DashboardMessage message={message} />
      <DashboardError error={error} />
      <DashboardLoading isLoading={isLoading} />
    </>
  );
}
