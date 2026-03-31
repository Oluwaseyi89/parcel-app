export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-20">
      <section className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Parcel App Web</h1>
        <p className="mt-3 text-base text-zinc-700">
          Stage 1 migration is complete. Core app infrastructure has been ported from the React app into Next.js,
          including typed state stores, API client utilities, and local storage adapters.
        </p>
      </section>

      <section className="rounded-2xl border border-black/10 bg-zinc-50 p-8">
        <h2 className="text-xl font-semibold">What is ready</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-700">
          <li>Environment-driven API base URL</li>
          <li>Typed helper models and constants</li>
          <li>SSR-safe local storage utility</li>
          <li>Zustand stores for auth, cart, product, order, deal and UI state</li>
          <li>Root provider bootstrapping for cart and auth hydration</li>
        </ul>
      </section>
    </main>
  );
}
