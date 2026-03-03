"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Beef, Droplets, Users, ShoppingCart,
  Truck, MapPin, TrendingUp, LogOut, CheckCircle2, Leaf
} from "lucide-react";

const links = [
  { href: "/dashboard",  label: "Admin Dashboard",    icon: LayoutDashboard },
  { href: "/cows",       label: "Cattle Registry",    icon: Beef },
  { href: "/milk",       label: "Milk Collection",    icon: Droplets },
  { href: "/customers",  label: "Customer Profiles",  icon: Users },
  { href: "/orders",     label: "Order Management",   icon: ShoppingCart },
  { href: "/delivery",   label: "Delivery Routes",    icon: Truck },
  { href: "/graph",      label: "Route Graph",        icon: MapPin },
  { href: "/reports",    label: "Sales Reports",      icon: TrendingUp },
];

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
  }

  return (
    <aside
      className="fixed top-0 left-0 h-full flex flex-col bg-white border-r border-slate-200 z-40"
      style={{ width: "208px" }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-green-800 flex items-center justify-center shrink-0">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">MILK IT</p>
            <p className="text-xs text-slate-400 uppercase tracking-widest">Dairy Systems</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-green-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-3 space-y-0.5 border-t border-slate-100 pt-3">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 w-full transition-all"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
        {/* Plan badge */}
        <div className="mx-1 mt-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-400">Current Plan</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm font-semibold text-slate-800">Pro Farmer</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
        </div>
      </div>
    </aside>
  );
}
