import Link from "next/link";

interface RouteStagePlaceholderProps {
  title: string;
  description: string;
}

export default function RouteStagePlaceholder({ title, description }: RouteStagePlaceholderProps) {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-14">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">Stage 3 Scaffold</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">{title}</h1>
        <p className="mt-3 max-w-2xl text-zinc-600">{description}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Back Home
          </Link>
          <Link
            href="/catalogue"
            className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400"
          >
            Browse Catalogue
          </Link>
        </div>
      </div>
    </section>
  );
}
