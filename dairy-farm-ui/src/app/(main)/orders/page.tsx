"use client";
import { useEffect, useState } from "react";
import { ShoppingCart, Plus, Trash2, CheckCircle } from "lucide-react";

interface Order { id: number; name: string; quantity: number; total: number; priority: 1|2; }

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [custId, setCustId] = useState("");
  const [qty, setQty]       = useState("");
  const [msg, setMsg]       = useState("");
  const [processed, setProcessed] = useState<Order | null>(null);

  const load = () => fetch("/api/orders").then(r => r.json()).then(setOrders);
  useEffect(() => { load(); }, []);

  async function place(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: +custId, quantity: +qty }),
    });
    const data = await res.json();
    setMsg(res.ok ? `Order placed! Total: RM ${data.total.toFixed(2)} [${data.priority === 1 ? "PREMIUM":"REGULAR"}]` : data.error);
    if (res.ok) { setCustId(""); setQty(""); load(); }
  }

  async function processNext() {
    const res = await fetch("/api/orders/process", { method: "POST" });
    const data = await res.json();
    if (res.ok) { setProcessed(data.processed); load(); }
    else setMsg(data.error);
  }

  async function cancel(id: number) {
    await fetch(`/api/orders?id=${id}`, { method: "DELETE" });
    setMsg(`Order for customer #${id} cancelled.`);
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-6">Order Management</h1>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><Plus className="w-4 h-4"/>Place Order</h2>
        <form onSubmit={place} className="flex flex-wrap gap-3">
          <input required type="number" min={1} placeholder="Customer ID"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 w-36 transition"
            value={custId} onChange={e => setCustId(e.target.value)}/>
          <input required type="number" min={0} step="0.01" placeholder="Quantity (L)"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 w-40 transition"
            value={qty} onChange={e => setQty(e.target.value)}/>
          <button type="submit" className="bg-green-800 hover:bg-green-900 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
            Place Order
          </button>
        </form>
        {msg && <p className="mt-2 text-sm text-slate-600">{msg}</p>}
      </div>

      <div className="flex gap-3 mb-5">
        <button onClick={processNext}
          className="flex items-center gap-2 bg-green-800 hover:bg-green-900 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
          <CheckCircle className="w-4 h-4"/> Process Next Order
        </button>
      </div>

      {processed && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 text-sm text-green-800">
          ✅ Fulfilled [{processed.priority === 1 ? "PREMIUM":"REGULAR"}] — {processed.name} | {processed.quantity.toFixed(2)} L | RM {processed.total.toFixed(2)}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Pending Orders ({orders.length})</h2>
        {orders.length === 0 ? <p className="text-slate-400 text-sm">No pending orders.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
              <th className="pb-2 pr-4 text-left font-medium">#</th><th className="pb-2 pr-4 text-left font-medium">Priority</th>
              <th className="pb-2 pr-4 text-left font-medium">Customer</th><th className="pb-2 pr-4 text-left font-medium">Qty (L)</th>
              <th className="pb-2 pr-4 text-left font-medium">Total (RM)</th><th className="pb-2 text-left font-medium">Action</th>
            </tr></thead>
            <tbody>{orders.map((o, i) => (
              <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                <td className="py-3 pr-4 text-slate-400">{i+1}</td>
                <td className="py-3 pr-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${o.priority === 1 ? "bg-amber-100 text-amber-700":"bg-slate-100 text-slate-600"}`}>
                    {o.priority === 1 ? "PREMIUM":"REGULAR"}
                  </span>
                </td>
                <td className="py-3 pr-4 text-slate-700 font-medium">{o.name}</td>
                <td className="py-3 pr-4 text-slate-600">{o.quantity.toFixed(2)}</td>
                <td className="py-3 pr-4 text-slate-600">{o.total.toFixed(2)}</td>
                <td className="py-3">
                  <button onClick={() => cancel(o.id)} className="text-red-400 hover:text-red-600 transition">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
