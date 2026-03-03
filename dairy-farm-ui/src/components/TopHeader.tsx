"use client";
import { Bell, Search } from "lucide-react";

export default function TopHeader() {
  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between px-6 bg-white border-b border-slate-200"
      style={{ left: "208px", height: "64px" }}
    >
      {/* Search */}
      <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 w-80">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          className="bg-transparent text-sm text-slate-600 placeholder-slate-400 focus:outline-none w-full"
          placeholder="Search for cows, orders or reports..."
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Bell */}
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition">
          <Bell className="w-5 h-5 text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-800 leading-tight">Uday</p>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Farm Admin</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-green-800 flex items-center justify-center text-white text-sm font-bold shrink-0">
            U
          </div>
        </div>
      </div>
    </header>
  );
}
