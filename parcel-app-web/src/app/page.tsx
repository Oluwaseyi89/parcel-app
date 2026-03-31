import Link from "next/link";

const stageRoutes = [
  "/vendor",
  "/courier",
  "/catalogue",
  "/hot-deals",
  "/customer",
  "/register-vendor",
  "/register-courier",
  "/register-customer",
  "/vendor-dash",
  "/courier-dash",
  "/customer-dash",
  "/cart-check",
  "/single",
  "/payment",
  "/verify",
  "/prod-detail",
];

export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-14">
      <section className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Parcel App Web</h1>
        <p className="mt-3 text-base text-zinc-700">
          Stage 3 is now active. Shared UI shell and route scaffolding have been recreated in Next.js, aligned to the
          original React app route map.
        </p>
      </section>

      <section className="rounded-2xl border border-black/10 bg-zinc-50 p-8">
        <h2 className="text-xl font-semibold">Scaffolded Routes</h2>
        <ul className="mt-4 grid gap-3 text-zinc-700 sm:grid-cols-2">
          {stageRoutes.map((route) => (
            <li key={route}>
              <Link
                href={route}
                className="block rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium hover:border-zinc-300"
              >
                {route}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
