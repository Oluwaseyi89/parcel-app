"use client";

import { useRouter } from "next/navigation";
import { useState, type ComponentType } from "react";
import { CreditCard, Home, LogOut, Menu, MessageSquare, Package, ShoppingCart, Tag, Truck, User, X } from "lucide-react";

import CourierDashboardModules from "@/components/dashboard/modules/CourierDashboardModules";
import CustomerDashboardModules from "@/components/dashboard/modules/CustomerDashboardModules";
import VendorDashboardModules from "@/components/dashboard/modules/VendorDashboardModules";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useAuthStore } from "@/lib/stores/authStore";

type Role = "customer" | "vendor" | "courier";

type TabItem = {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
};

const TAB_CONFIG: Record<Role, TabItem[]> = {
  customer: [
    { key: "carts", label: "Carts", icon: ShoppingCart, description: "Review and manage your cart items." },
    { key: "orders", label: "Orders", icon: Package, description: "Track your placed orders and current status." },
    { key: "deliveries", label: "Deliveries", icon: Truck, description: "Check delivery updates and ETAs." },
    { key: "notifications", label: "Notifications", icon: MessageSquare, description: "Read system and order notifications." },
    { key: "complaints", label: "Complaints", icon: MessageSquare, description: "Create and monitor complaint tickets." },
  ],
  vendor: [
    { key: "products", label: "Products", icon: Package, description: "Add, edit, and review your product catalog." },
    { key: "deals", label: "Deals", icon: Tag, description: "Manage promotions and hot deal campaigns." },
    { key: "transactions", label: "Transactions", icon: CreditCard, description: "Inspect payouts and sales transactions." },
    { key: "resolutions", label: "Resolutions", icon: MessageSquare, description: "Respond to customer issues and resolutions." },
  ],
  courier: [
    { key: "deals", label: "Deals", icon: Tag, description: "See courier deal assignments and availability." },
    { key: "dispatches", label: "Dispatches", icon: Truck, description: "Handle active dispatches and route statuses." },
    { key: "transactions", label: "Transactions", icon: CreditCard, description: "Review earnings and completed payouts." },
    { key: "resolutions", label: "Resolutions", icon: MessageSquare, description: "Handle delivery dispute resolutions." },
  ],
};

const REDIRECT_PATH: Record<Role, string> = {
  customer: "/customer",
  vendor: "/vendor",
  courier: "/courier",
};

const ROLE_ACCENT: Record<Role, string> = {
  customer: "bg-rose-600",
  vendor: "bg-rose-600",
  courier: "bg-rose-600",
};

export default function RoleDashboardView({ role }: { role: Role }) {
  const router = useRouter();
  const authStore = useAuthStore();
  const auth = useRequireAuth({ requiredRole: role, redirectTo: REDIRECT_PATH[role] });
  const [switchingRole, setSwitchingRole] = useState(false);
  const [switchError, setSwitchError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = role === "customer" ? auth.customer : role === "vendor" ? auth.vendor : auth.courier;
  const tabs = TAB_CONFIG[role];
  const switchableRoles = auth.allowedRoles;
  const [activeTab, setActiveTab] = useState(tabs[0]?.key ?? "");

  async function logout() {
    if (role === "customer") {
      await authStore.logoutCustomer();
    } else if (role === "vendor") {
      await authStore.logoutVendor();
    } else {
      await authStore.logoutCourier();
    }
    router.replace(REDIRECT_PATH[role]);
    router.refresh();
  }

  async function switchRole(nextRole: Role) {
    if (nextRole === role) return;
    setSwitchError("");
    setSwitchingRole(true);
    try {
      await authStore.switchActiveRole(nextRole);
      router.replace(nextRole === "customer" ? "/customer-dash" : nextRole === "vendor" ? "/vendor-dash" : "/courier-dash");
      router.refresh();
    } catch {
      setSwitchError("Unable to switch role right now. Please try again.");
    } finally {
      setSwitchingRole(false);
    }
  }

  function handleTabChange(key: string) {
    setActiveTab(key);
    setSidebarOpen(false);
  }

  if (!auth.ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-zinc-500">Checking your session…</p>
      </div>
    );
  }

  const fullName = `${String(user?.last_name ?? "")} ${String(user?.first_name ?? "")}`.trim() || "User";
  const photo = String((user?.cus_photo ?? user?.vend_photo ?? user?.cour_photo ?? "") as string);
  const selectedTab = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];
  const accent = ROLE_ACCENT[role];

  // Shared sidebar content rendered in both desktop sidebar and mobile drawer
  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-5">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${accent} text-xs font-bold text-white`}>
          PA
        </span>
        <div>
          <p className="text-sm font-semibold text-zinc-900">Parcel App</p>
          <p className="text-[11px] capitalize text-zinc-400">{role} Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Navigation</p>
        <ul className="space-y-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <li key={tab.key}>
                <button
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? `${accent} text-white shadow-sm` : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer section: user info, role switcher, home, logout */}
      <div className="space-y-1 border-t border-zinc-100 px-3 py-4">
        {switchableRoles.length > 1 && (
          <div className="mb-3 px-1">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
              Active Role
            </label>
            <select
              value={role}
              onChange={(e) => void switchRole(e.target.value as Role)}
              disabled={switchingRole}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-sm text-zinc-700"
            >
              {switchableRoles.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
            {switchError && <p className="mt-1 text-xs text-red-600">{switchError}</p>}
          </div>
        )}

        {/* User info */}
        <div className="mb-1 flex items-center gap-2.5 rounded-xl bg-zinc-50 px-3 py-2.5">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-white">
            {photo ? (
              <img src={photo} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              <User className="m-auto mt-1 h-5 w-5 text-zinc-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-800">{fullName}</p>
            <p className="truncate text-xs text-zinc-400">{String(user?.email ?? "")}</p>
          </div>
        </div>

        {/* Back to Home */}
        <button
          onClick={() => router.push("/home")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
        >
          <Home className="h-4 w-4 shrink-0" />
          Back to Home
        </button>

        {/* Logout */}
        <button
          onClick={() => void logout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-zinc-200 lg:bg-white lg:shadow-sm">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex flex-1 items-center gap-2">
            <span className={`grid h-7 w-7 place-items-center rounded-lg ${accent} text-[10px] font-bold text-white`}>
              PA
            </span>
            <span className="text-sm font-semibold capitalize text-zinc-800">{role} Dashboard</span>
          </div>
          <div className="h-8 w-8 overflow-hidden rounded-full border border-zinc-200 bg-white">
            {photo ? (
              <img src={photo} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              <User className="m-auto mt-1 h-5 w-5 text-zinc-400" />
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-zinc-900">{selectedTab?.label}</h1>
            <p className="mt-1 text-sm text-zinc-500">{selectedTab?.description}</p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            {role === "customer" && (
              <CustomerDashboardModules
                tab={activeTab as "carts" | "orders" | "deliveries" | "notifications" | "complaints"}
                user={user}
              />
            )}
            {role === "vendor" && (
              <VendorDashboardModules
                tab={activeTab as "products" | "deals" | "transactions" | "resolutions"}
                user={user}
              />
            )}
            {role === "courier" && (
              <CourierDashboardModules
                tab={activeTab as "deals" | "dispatches" | "transactions" | "resolutions"}
                user={user}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
