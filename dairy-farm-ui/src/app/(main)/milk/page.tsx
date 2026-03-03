"use client";
import { useEffect, useState } from "react";
import { Droplets, Plus } from "lucide-react";

export default function MilkPage() {
  const [entries, setEntries] = useState<number[]>([]);
  const [total, setTotal]     = useState(0);
  const [qty, setQty]         = useState("");
  const [msg, setMsg]         = useState("");

  const load = () =>
    fetch("/api/milk").then(r => r.json()).then(d => { setEntries(d.entries); setTotal(d.total); });
  useEffect(() => { load(); }, []);

  async function push(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/milk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: +qty }),
    });
    const data = await res.json();
    setMsg(res.ok ? `Pushed ${qty} L. Total: ${data.total.toFixed(2)} L` : data.error);
    if (res.ok) { setQty(""); load(); }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-6">Milk Collection</h1>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><Plus className="w-4 h-4"/>Log Milk Entry (Stack LIFO)</h2>
        <form onSubmit={push} className="flex gap-3">
          <input required type="number" min={0} step="0.01" placeholder="Quantity (L)"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 w-48 transition"
            value={qty} onChange={e => setQty(e.target.value)}
          />
          <button type="submit" className="bg-green-800 hover:bg-green-900 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
            Push Entry
          </button>
        </form>
        {msg && <p className="mt-2 text-sm text-green-700 font-medium">{msg}</p>}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">Stack (top → bottom)</h2>
          <span className="text-sm text-slate-500">Total: <strong className="text-slate-800">{total.toFixed(2)} L</strong></span>
        </div>
        {entries.length === 0 ? <p className="text-slate-400 text-sm">No milk entries yet.</p> : (
          <div className="space-y-2">
            {entries.map((qty, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${
                i === 0 ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-100"
              }`}>
                <span className="text-xs font-semibold w-12 text-slate-400">{i === 0 ? "TOP" : `#${entries.length - i}`}</span>
                <span className={`font-semibold text-sm ${i === 0 ? "text-green-800" : "text-slate-700"}`}>{qty.toFixed(2)} L</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
