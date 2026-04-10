"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

import { useCartStore } from "@/lib/stores/cartStore";
import { useAuthStore } from "@/lib/stores/authStore";

type NavItem = {
  href: string;
  label: string;
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
  const menuRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navItems: NavItem[] = [
    { href: "/home", label: "Home" },
    { href: "/catalogue", label: "Catalogue" },
    { href: "/hot-deals", label: "Hot Deals" },
  ];

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
    <header className="sticky top-0 z-40 border-b-2 border-rose-600 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-600 text-sm font-bold text-white">PA</span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Parcel App</p>
            <p className="text-xs text-zinc-500">Fast Delivery</p>
          </div>
        </Link>

        <div className="flex items-center gap-5">
          <Link href="/cart-check" className="relative rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800">
            Cart
            {cartTotal > 0 && (
              <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-rose-600 px-1 text-xs font-bold text-white">
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
              <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-[0_14px_40px_-18px_rgba(225,29,72,0.45)]">
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
        </div>
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
