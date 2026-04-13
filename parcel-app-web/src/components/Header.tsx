"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Flame,
  Home,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react";

import { useCartStore } from "@/lib/stores/cartStore";
import { useAuthStore } from "@/lib/stores/authStore";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const cartTotal = useCartStore((state) => state.cartTotal);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeRole = useAuthStore((state) => state.activeRole);
  const logout = useAuthStore((state) => state.logout);
  const accountActive = pathname === "/account";
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navItems: NavItem[] = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/catalogue", label: "Catalogue", icon: Package },
    { href: "/hot-deals", label: "Hot Deals", icon: Flame },
  ];

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    setMobileSearchOpen(false);
    setMobileNavOpen(false);
    if (!query) {
      router.push("/catalogue");
      return;
    }
    router.push(`/catalogue?search=${encodeURIComponent(query)}`);
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setMobileNavOpen(false);
    setMobileSearchOpen(false);
  }, [pathname]);

  function queueMenuClose() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = setTimeout(() => {
      setMenuOpen(false);
    }, 1100);
  }

  function cancelQueuedClose() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    router.replace("/");
    router.refresh();
  }

  const roleLabel = activeRole ? `${activeRole.charAt(0).toUpperCase()}${activeRole.slice(1)}` : "Guest";
  const dashboardPath = activeRole === "customer" ? "/customer-dash" : activeRole === "vendor" ? "/vendor-dash" : "/courier-dash";

  return (
    <header className="sticky top-0 z-40 border-b border-rose-100 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/80">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-xl p-1 transition hover:bg-zinc-100/70">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-600 text-sm font-bold text-white shadow-sm">PA</span>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Parcel App</p>
              <p className="text-xs text-zinc-500">Fast Delivery</p>
            </div>
          </Link>

          <form onSubmit={handleSearchSubmit} className="relative ml-2 hidden flex-1 md:block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search products, vendors, or categories"
              className="h-11 w-full rounded-full border border-zinc-200 bg-zinc-50 pl-11 pr-28 text-sm text-zinc-800 outline-none transition focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100"
              aria-label="Search products"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
            >
              Search
            </button>
          </form>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen((prev) => !prev);
                setMobileNavOpen(false);
              }}
              className="rounded-full border border-zinc-200 p-2 text-zinc-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 md:hidden"
              aria-label="Open search"
            >
              <Search className="h-5 w-5" />
            </button>

            <Link
              href="/cart-check"
              className="relative inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">Cart</span>
              {cartTotal > 0 && (
                <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                  {cartTotal > 99 ? "99+" : cartTotal}
                </span>
              )}
            </Link>

            <div
              ref={menuRef}
              className="relative"
              onMouseLeave={queueMenuClose}
              onMouseEnter={cancelQueuedClose}
            >
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className={`list-none cursor-pointer rounded-full border p-2.5 shadow-sm transition ${
                  accountActive || menuOpen
                    ? "border-rose-500 bg-rose-50 text-rose-700"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-rose-300 hover:bg-rose-50/70 hover:text-rose-700"
                }`}
              >
                <span className="sr-only">Account menu</span>
                <User className="h-5 w-5" />
              </button>

              {menuOpen ? (
                <div className="absolute right-0 mt-3 w-60 overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-[0_14px_40px_-18px_rgba(225,29,72,0.45)]">
                  <div className="bg-linear-to-r from-rose-50 to-amber-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Account</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {isAuthenticated ? `${roleLabel} session active` : "Login and choose your role"}
                    </p>
                  </div>
                  <div className="p-2">
                    {isAuthenticated ? (
                      <>
                        <Link
                          href={dashboardPath}
                          onClick={() => setMenuOpen(false)}
                          className="block rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                        >
                          Open {roleLabel} dashboard
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleLogout()}
                          className="mt-1 flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </button>
                      </>
                    ) : (
                      <Link
                        href="/account"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                      >
                        Login
                      </Link>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileNavOpen((prev) => !prev);
                setMobileSearchOpen(false);
              }}
              className="rounded-full border border-zinc-200 p-2 text-zinc-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 md:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileSearchOpen ? (
          <form onSubmit={handleSearchSubmit} className="mt-3 flex gap-2 md:hidden">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm text-zinc-800 outline-none transition focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100"
                aria-label="Search products"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Go
            </button>
          </form>
        ) : null}
      </div>

      <nav className="hidden border-t border-zinc-200 bg-white md:block">
        <ul className="mx-auto flex w-full max-w-6xl items-center gap-1 px-3 py-2 sm:px-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    active ? "bg-rose-600 text-white shadow-sm" : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {mobileNavOpen ? (
        <nav className="border-t border-zinc-200 bg-white p-3 md:hidden">
          <ul className="grid grid-cols-1 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active ? "bg-rose-600 text-white" : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
