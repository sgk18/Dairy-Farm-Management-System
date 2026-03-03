"use client";
import { useEffect, useState } from "react";
import { Truck, Plus, RefreshCw } from "lucide-react";

interface Zone { zoneId: number; zoneName: string; }

export default function DeliveryPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [form, setForm]   = useState({ zoneId:"", zoneName:"" });
  const [msg, setMsg]     = useState("");

  const load = () => fetch("/api/delivery/zones").then(r => r.json()).then(setZones);
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/delivery/zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zoneId: +form.zoneId, zoneName: form.zoneName }),
    });
    const data = await res.json();
    setMsg(res.ok ? `Zone #${form.zoneId} added to circular schedule.` : data.error);
    if (res.ok) { setForm({ zoneId:"", zoneName:"" }); load(); }
  }

  // Simulate circular display by repeating twice
  const circular = zones.length > 0 ? [...zones, ...zones] : [];

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-6">Delivery Routes</h1>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><Plus className="w-4 h-4"/>Add Delivery Zone (Circular LL)</h2>
        <form onSubmit={add} className="flex gap-3 flex-wrap">
          <input required type="number" min={1} placeholder="Zone ID"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 w-32 transition"
            value={form.zoneId} onChange={e => setForm(p => ({...p, zoneId: e.target.value}))}/>
          <input required placeholder="Zone Name"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 w-48 transition"
            value={form.zoneName} onChange={e => setForm(p => ({...p, zoneName: e.target.value}))}/>
          <button type="submit" className="bg-green-800 hover:bg-green-900 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
            Add Zone
          </button>
        </form>
        {msg && <p className="mt-2 text-sm text-green-700 font-medium">{msg}</p>}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="w-4 h-4 text-slate-500"/>
          <h2 className="text-sm font-semibold text-slate-700">Circular Schedule ({zones.length} zones)</h2>
        </div>
        {zones.length === 0 ? <p className="text-slate-400 text-sm">No delivery zones defined.</p> : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {circular.map((z, i) => (
                <div key={i} className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border font-medium ${
                  i < zones.length ? "bg-green-50 border-green-200 text-green-800" : "bg-slate-50 border-slate-200 text-slate-500"
                }`}>
                  {i > 0 && <span className="text-slate-300 mr-1">→</span>}
                  <span className="font-semibold">#{z.zoneId}</span>
                  <span className="ml-1">{z.zoneName}</span>
                </div>
              ))}
              <div className="flex items-center text-xs text-slate-400 italic px-3 py-1.5">
                → (circles back to {zones[0]?.zoneName})
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
              After <strong>{zones[zones.length-1]?.zoneName}</strong>, the route returns to <strong>{zones[0]?.zoneName}</strong> (circular).
            </div>
          </>
        )}
      </div>
    </div>
  );
}
