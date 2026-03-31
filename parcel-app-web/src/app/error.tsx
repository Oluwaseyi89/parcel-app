"use client";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">Application Error</p>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Something went wrong</h1>
      <p className="max-w-xl text-zinc-600">{error.message || "An unexpected error occurred."}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-zinc-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
      >
        Try again
      </button>
    </main>
  );
}
