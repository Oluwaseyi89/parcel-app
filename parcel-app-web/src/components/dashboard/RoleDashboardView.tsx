"use client";

import { useRouter } from "next/navigation";
import { useState, type ComponentType } from "react";
import { CreditCard, LogOut, MessageSquare, Package, ShoppingCart, Tag, Truck, User } from "lucide-react";

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

export default function RoleDashboardView({ role }: { role: Role }) {
  const router = useRouter();
  const authStore = useAuthStore();
  const auth = useRequireAuth({ requiredRole: role, redirectTo: REDIRECT_PATH[role] });
  const [switchingRole, setSwitchingRole] = useState(false);
  const [switchError, setSwitchError] = useState("");

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
    if (nextRole === role) {
      return;
    }

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

  if (!auth.ready) {
    return (
      <section className="min-h-screen bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-zinc-600">Checking your session...</p>
        </div>
      </section>
    );
  }

  const fullName = `${String(user?.last_name ?? "")} ${String(user?.first_name ?? "")}`.trim() || "User";
  const photo = String((user?.cus_photo ?? user?.vend_photo ?? user?.cour_photo ?? "") as string);
  const selectedTab = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];

  return (
    <section className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">{role.charAt(0).toUpperCase() + role.slice(1)} Dashboard</h1>
              <p className="mt-1 text-zinc-600">Hello, {fullName}</p>
              {switchError ? <p className="mt-2 text-sm text-red-600">{switchError}</p> : null}
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              {switchableRoles.length > 1 ? (
                <select
                  aria-label="Switch active role"
                  value={role}
                  onChange={(event) => void switchRole(event.target.value as Role)}
                  disabled={switchingRole}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700"
                >
                  {switchableRoles.map((item) => (
                    <option key={item} value={item}>
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </option>
                  ))}
                </select>
              ) : null}
              <button
                onClick={() => void logout()}
                className="inline-flex items-center rounded-lg border border-danger px-4 py-2 text-sm font-medium text-danger hover:bg-danger hover:text-white"
              >
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4 rounded-lg bg-zinc-50 p-4">
            <div className="h-14 w-14 overflow-hidden rounded-full border border-zinc-200 bg-white">
              {photo ? <img src={photo} alt={fullName} className="h-full w-full object-cover" /> : <User className="m-auto mt-3 h-8 w-8 text-zinc-400" />}
            </div>
            <div>
              <p className="font-medium text-zinc-800">{fullName}</p>
              <p className="text-sm text-zinc-500">{String(user?.email ?? "No email available")}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="grid grid-cols-2 gap-2 border-b border-zinc-200 p-3 md:grid-cols-5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium ${
                    active ? "bg-danger text-white" : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <Icon className="mr-2 h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            <h2 className="text-xl font-semibold text-zinc-900">{selectedTab.label}</h2>
            <p className="mt-2 text-zinc-600">{selectedTab.description}</p>
            <div className="mt-5">
              {role === "customer" && <CustomerDashboardModules tab={activeTab as "carts" | "orders" | "deliveries" | "notifications" | "complaints"} user={user} />}
              {role === "vendor" && <VendorDashboardModules tab={activeTab as "products" | "deals" | "transactions" | "resolutions"} user={user} />}
              {role === "courier" && <CourierDashboardModules tab={activeTab as "deals" | "dispatches" | "transactions" | "resolutions"} user={user} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
