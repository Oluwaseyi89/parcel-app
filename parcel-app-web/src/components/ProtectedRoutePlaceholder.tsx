"use client";

import RouteStagePlaceholder from "@/components/RouteStagePlaceholder";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";

interface ProtectedRoutePlaceholderProps {
  title: string;
  description: string;
  requiredRole?: "customer" | "vendor" | "courier";
}

export default function ProtectedRoutePlaceholder({
  title,
  description,
  requiredRole,
}: ProtectedRoutePlaceholderProps) {
  const { hydrated, ready } = useRequireAuth({ requiredRole });

  if (!hydrated || !ready) {
    return (
      <section className="mx-auto w-full max-w-5xl px-6 py-14">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-zinc-500">Checking your session...</p>
        </div>
      </section>
    );
  }

  return <RouteStagePlaceholder title={title} description={description} />;
}
