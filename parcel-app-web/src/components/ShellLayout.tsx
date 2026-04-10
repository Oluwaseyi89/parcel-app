"use client";

import { usePathname } from "next/navigation";

import Footer from "./Footer";
import Header from "./Header";

const DASHBOARD_PATHS = ["/customer-dash", "/vendor-dash", "/courier-dash"];

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = DASHBOARD_PATHS.some((p) => pathname.startsWith(p));

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-zinc-50">{children}</main>
      <Footer />
    </>
  );
}
