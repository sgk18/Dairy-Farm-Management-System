"use client";
import { useEffect, useState } from "react";
import { TrendingUp, Plus, Filter } from "lucide-react";

interface Sale { date: string; revenue: number; }

export default function ReportsPage() {
  const [sales, setSales]   = useState<Sale[]>([]);
  const [total, setTotal]   = useState(0);
  const [form, setForm]     = useState({ date:"", revenue:"" });
  const [filter, setFilter] = useState("");
  const [msg, setMsg]       = useState("");

  const load = (month?: string) => {
    const url = month ? `/api/sales?month=${month}` : "/api/sales";
    fetch(url).then(r => r.json()).then(d => { setSales(d.sales); setTotal(d.total); });
  };
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: form.date, revenue: +form.revenue }),
    });
    const data = await res.json();
    setMsg(res.ok ? "Sale recorded!" : data.error);
    if (res.ok) { setForm({ date:"", revenue:"" }); load(filter || undefined); }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-6">Sales Reports</h1>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><Plus className="w-4 h-4"/>Record Sale</h2>
        <form onSubmit={add} className="flex flex-wrap gap-3">
          <input required placeholder="Date (DD/MM/YYYY)" pattern="\d{2}/\d{2}/\d{4}"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 w-44 transition"
            value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))}/>
          <input required type="number" min={0} step="0.01" placeholder="Revenue (RM)"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 w-40 transition"
            value={form.revenue} onChange={e => setForm(p => ({...p, revenue: e.target.value}))}/>
          <button type="submit" className="bg-green-800 hover:bg-green-900 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
            Record
          </button>
        </form>
        {msg && <p className="mt-2 text-sm text-green-700 font-medium">{msg}</p>}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Filter className="w-4 h-4"/> Monthly Report
          </h2>
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
            value={filter} onChange={e => { setFilter(e.target.value); load(e.target.value || undefined); }}>
            <option value="">All Months</option>
            {Array.from({length:12},(_,i)=>i+1).map(m=>(
              <option key={m} value={m}>{String(m).padStart(2,"0")} - {new Date(0,m-1).toLocaleString("default",{month:"long"})}</option>
            ))}
          </select>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4 flex items-center justify-between">
          <span className="text-sm text-green-700 font-medium">
            {filter ? `Month ${String(filter).padStart(2,"0")}` : "All Time"} — {sales.length} sale(s)
          </span>
          <span className="text-lg font-bold text-slate-800">RM {total.toFixed(2)}</span>
        </div>

        {sales.length === 0 ? <p className="text-slate-400 text-sm">No sales recorded.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
              <th className="pb-2 pr-4 text-left font-medium">#</th>
              <th className="pb-2 pr-4 text-left font-medium">Date</th>
              <th className="pb-2 text-left font-medium">Revenue (RM)</th>
            </tr></thead>
            <tbody>{sales.map((s, i) => (
              <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                <td className="py-3 pr-4 text-slate-400">{i+1}</td>
                <td className="py-3 pr-4 font-mono font-semibold text-slate-700">{s.date}</td>
                <td className="py-3 font-semibold text-slate-800">{s.revenue.toFixed(2)}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
