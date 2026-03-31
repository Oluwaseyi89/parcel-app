"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuthStore } from "@/lib/stores/authStore";
import { useCartStore } from "@/lib/stores/cartStore";

type NavItem = {
  href: string;
  label: string;
};

export default function Header() {
  const pathname = usePathname();
  const cartTotal = useCartStore((state) => state.cartTotal);
  const customer = useAuthStore((state) => state.customer);
  const vendor = useAuthStore((state) => state.vendor);
  const courier = useAuthStore((state) => state.courier);

  const navItems: NavItem[] = [
    { href: "/home", label: "Home" },
    { href: vendor ? "/vendor-dash" : "/vendor", label: "Vendor" },
    { href: courier ? "/courier-dash" : "/courier", label: "Courier" },
    { href: "/catalogue", label: "Catalogue" },
    { href: "/hot-deals", label: "Hot Deals" },
    { href: customer ? "/customer-dash" : "/customer", label: "Customer" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b-2 border-rose-600 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-600 text-sm font-bold text-white">PA</span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Parcel App</p>
            <p className="text-xs text-zinc-500">Fast Delivery</p>
          </div>
        </Link>

        <Link href="/cart-check" className="relative rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800">
          Cart
          {cartTotal > 0 && (
            <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-rose-600 px-1 text-xs font-bold text-white">
              {cartTotal > 99 ? "99+" : cartTotal}
            </span>
          )}
        </Link>
      </div>

      <nav className="border-t border-zinc-200 bg-white">
        <ul className="mx-auto flex w-full max-w-6xl items-center gap-1 overflow-x-auto px-3 py-2 sm:px-6">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-full px-4 py-2 text-sm font-medium transition ${
                    active ? "bg-rose-600 text-white" : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
