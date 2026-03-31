import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-rose-700 text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 md:grid-cols-3">
        <section>
          <h3 className="text-lg font-semibold">Parcel App</h3>
          <p className="mt-3 text-sm text-rose-100">
            Reliable delivery infrastructure connecting vendors, couriers, and customers.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Quick Links</h3>
          <ul className="mt-3 space-y-2 text-sm text-rose-100">
            <li>
              <Link href="/home" className="hover:text-white">
                Home
              </Link>
            </li>
            <li>
              <Link href="/catalogue" className="hover:text-white">
                Catalogue
              </Link>
            </li>
            <li>
              <Link href="/hot-deals" className="hover:text-white">
                Hot Deals
              </Link>
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Support</h3>
          <p className="mt-3 text-sm text-rose-100">support@parcelapp.ng</p>
          <p className="text-sm text-rose-100">+234 801 234 5678</p>
        </section>
      </div>

      <div className="border-t border-rose-600 bg-rose-800 px-6 py-4 text-center text-sm text-rose-100">
        © {year} Parcel App. All rights reserved.
      </div>
    </footer>
  );
}
