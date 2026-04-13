import Link from "next/link";
import { Clock3, Mail, MapPin, Package2, Phone, ShieldCheck, Truck, WalletCards } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-16 overflow-hidden bg-rose-700 text-rose-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-rose-300/25 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-rose-900/25 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 lg:py-14">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          <section>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-600 text-white">
                <Package2 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-white">Parcel App</h3>
                <p className="text-xs text-rose-200">Delivery, simplified</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-rose-100">
              Reliable logistics infrastructure connecting vendors, couriers, and customers across cities with speed and visibility.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-rose-500 bg-rose-800/60 px-3 py-1 text-xs text-rose-100">Fast Dispatch</span>
              <span className="rounded-full border border-rose-500 bg-rose-800/60 px-3 py-1 text-xs text-rose-100">Tracked Deliveries</span>
              <span className="rounded-full border border-rose-500 bg-rose-800/60 px-3 py-1 text-xs text-rose-100">Secure Payments</span>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-rose-200">Explore</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/home" className="inline-flex items-center gap-2 text-rose-100 transition hover:text-white">
                  <Truck className="h-4 w-4 text-rose-300" /> Home
                </Link>
              </li>
              <li>
                <Link href="/catalogue" className="inline-flex items-center gap-2 text-rose-100 transition hover:text-white">
                  <Package2 className="h-4 w-4 text-rose-300" /> Catalogue
                </Link>
              </li>
              <li>
                <Link href="/hot-deals" className="inline-flex items-center gap-2 text-rose-100 transition hover:text-white">
                  <WalletCards className="h-4 w-4 text-rose-300" /> Hot Deals
                </Link>
              </li>
              <li>
                <Link href="/account" className="inline-flex items-center gap-2 text-rose-100 transition hover:text-white">
                  <ShieldCheck className="h-4 w-4 text-rose-300" /> Account Access
                </Link>
              </li>
            </ul>
          </section>

          <section>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-rose-200">Support</h4>
            <ul className="mt-4 space-y-3 text-sm text-rose-100">
              <li className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-rose-300" /> support@parcelapp.ng
              </li>
              <li className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4 text-rose-300" /> +234 801 234 5678
              </li>
              <li className="inline-flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-rose-300" /> Lagos, Nigeria
              </li>
              <li className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-rose-300" /> Mon - Fri, 8AM - 6PM
              </li>
            </ul>
          </section>

          <section>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-rose-200">Stay Updated</h4>
            <p className="mt-4 text-sm text-rose-100">Get platform updates and delivery insights in your inbox.</p>
            <form className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="h-10 w-full min-w-55 flex-2 rounded-xl border border-rose-500 bg-rose-800 px-3 text-sm text-rose-50 outline-none transition placeholder:text-rose-300 focus:border-rose-200"
                aria-label="Email address"
              />
              <button
                type="button"
                className="h-10 shrink-0 rounded-xl bg-white px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Subscribe
              </button>
            </form>
          </section>
        </div>

        <div className="mt-10 border-t border-rose-600 pt-5">
          <div className="flex flex-col gap-3 text-sm text-rose-100 sm:flex-row sm:items-center sm:justify-between">
            <p>© {year} Parcel App. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/home" className="transition hover:text-white">Home</Link>
              <Link href="/catalogue" className="transition hover:text-white">Catalogue</Link>
              <Link href="/hot-deals" className="transition hover:text-white">Hot Deals</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
