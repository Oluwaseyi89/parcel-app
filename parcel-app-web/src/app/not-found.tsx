import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">404</p>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Page not found</h1>
      <p className="max-w-xl text-zinc-600">The route you requested does not exist in the current migration stage.</p>
      <Link
        href="/"
        className="rounded-full bg-zinc-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
      >
        Return home
      </Link>
    </main>
  );
}
