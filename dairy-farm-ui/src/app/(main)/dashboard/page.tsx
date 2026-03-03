"use client";
import { useEffect, useState } from "react";
import { Beef, Droplets, ShoppingCart, DollarSign, Truck, MapPin } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip
} from "recharts";

interface Stats {
  cows: number; totalMilk: number; pendingOrders: number;
  deliveryZones: number; deliveryLocations: number; customers: number;
}

const weekData = [
  { day: "MON", value: 38 },
  { day: "TUE", value: 32 },
  { day: "WED", value: 45 },
  { day: "THU", value: 50 },
  { day: "FRI", value: 44 },
  { day: "SAT", value: 36 },
  { day: "SUN", value: 54 },
];

const statCards = [
  {
    key: "cows" as const,
    label: "Total Cows",
    badge: "+0%",
    badgeColor: "bg-green-100 text-green-700",
    icon: Beef,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
  },
  {
    key: "totalMilk" as const,
    label: "Total Milk Today",
    badge: "Daily",
    badgeColor: "bg-blue-100 text-blue-600",
    icon: Droplets,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-500",
    suffix: " L",
  },
  {
    key: "pendingOrders" as const,
    label: "Pending Orders",
    badge: "Urgent",
    badgeColor: "bg-red-100 text-red-600",
    icon: ShoppingCart,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-500",
  },
  {
    key: "customers" as const,
    label: "Daily Revenue",
    badge: "-12.5%",
    badgeColor: "bg-red-100 text-red-500",
    icon: DollarSign,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    prefix: "$",
    multiply: 50,
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(setStats);
    const id = setInterval(() => {
      fetch("/api/dashboard").then(r => r.json()).then(setStats);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  function formatVal(card: typeof statCards[0], stats: Stats) {
    const raw = stats[card.key];
    if ("multiply" in card) return `${card.prefix ?? ""}${(raw * (card.multiply ?? 1)).toFixed(2)}`;
    if ("suffix" in card) return `${raw.toFixed ? raw.toFixed(1) : raw}${card.suffix ?? ""}`;
    return String(raw);
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-6">Admin Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${card.badgeColor}`}>
                  {card.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-slate-800">
                {stats == null ? "…" : formatVal(card, stats)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Chart + Queue */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        {/* Bar Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="font-semibold text-slate-800">Cattle Yield Overview</h2>
              <p className="text-xs text-slate-400">Weekly production performance</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">Last 7 Days ↗</span>
          </div>
          <div className="mt-4" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} barCategoryGap="30%">
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {weekData.map((entry, index) => (
                    <Cell
                      key={entry.day}
                      fill={index === weekData.length - 1 ? "#14532d" : "#bbf7d0"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Queue panel */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Priority Queue</h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-medium">NEXT 3</span>
          </div>
          <div className="space-y-3">
            {[
              { id: "P1", name: "Order #501 – Uday...", sub: "Premium Membership", time: "09:00 AM", accent: "bg-green-800" },
              { id: "P2", name: "Order #502 – Sara...", sub: "Standard Delivery",  time: "09:15 AM", accent: "bg-slate-200" },
              { id: "P3", name: "Order #503 – Mik...", sub: "Standard Delivery",  time: "09:45 AM", accent: "bg-slate-200" },
            ].map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className={`w-1.5 h-10 rounded-full ${item.accent} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.sub}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full text-center text-xs font-medium text-slate-500 hover:text-slate-800 transition">
            View All Orders
          </button>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Recent Activities</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
              <th className="pb-2 text-left font-medium">Activity</th>
              <th className="pb-2 text-left font-medium">Entity</th>
              <th className="pb-2 text-left font-medium">User</th>
              <th className="pb-2 text-left font-medium">Status</th>
              <th className="pb-2 text-left font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {[
              { icon: "➕", activity: "New Cattle Registered", entity: "Cow #101",    user: "System Admin",   status: "SUCCESS",   statusStyle: "bg-green-100 text-green-700", time: "2 mins ago" },
              { icon: "🛒", activity: "Order Placed",          entity: "Order #501",  user: "Uday",           status: "PENDING",   statusStyle: "bg-blue-100 text-blue-600",  time: "15 mins ago" },
              { icon: "🧪", activity: "Milk Quality Test",     entity: "Batch #92",   user: "Lab Assistant",  status: "COMPLETED", statusStyle: "bg-purple-100 text-purple-600", time: "1 hour ago" },
            ].map((row, i) => (
              <tr key={i} className="border-b border-slate-50 last:border-0">
                <td className="py-3 text-slate-700">
                  <span className="mr-2">{row.icon}</span>{row.activity}
                </td>
                <td className="py-3 font-semibold text-slate-800">{row.entity}</td>
                <td className="py-3 text-slate-500">{row.user}</td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${row.statusStyle}`}>
                    {row.status}
                  </span>
                </td>
                <td className="py-3 text-slate-400 text-xs">{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
