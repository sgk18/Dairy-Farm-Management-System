"use client";
import { useEffect, useState } from "react";
import { Users, Plus, Trash2, Search } from "lucide-react";

interface Customer { customerId: number; name: string; type: "Premium" | "Regular"; }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({ customerId: "", name: "", type: "Regular" as "Premium"|"Regular" });
  const [searchId, setSearchId]   = useState("");
  const [found, setFound]         = useState<Customer | null | "not-found">(null);
  const [msg, setMsg]             = useState("");

  const load = () => fetch("/api/customers").then(r => r.json()).then(setCustomers);
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: +form.customerId, name: form.name, type: form.type }),
    });
    const data = await res.json();
    setMsg(res.ok ? `Customer #${form.customerId} registered!` : data.error);
    if (res.ok) { setForm({ customerId:"", name:"", type:"Regular" }); load(); }
  }

  async function del(id: number) {
    await fetch(`/api/customers?id=${id}`, { method: "DELETE" });
    setMsg(`Customer #${id} deleted.`);
    load();
  }

  function doSearch() {
    const id = parseInt(searchId);
    const c = customers.find(c => c.customerId === id);
    setFound(c ?? "not-found");
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-6">Customer Profiles</h1>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><Plus className="w-4 h-4"/>Register Customer</h2>
        <form onSubmit={add} className="flex flex-wrap gap-3">
          <input required type="number" min={1} placeholder="Customer ID"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 w-36 transition"
            value={form.customerId} onChange={e => setForm(p => ({...p, customerId: e.target.value}))}/>
          <input required placeholder="Name"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 w-48 transition"
            value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}/>
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
            value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value as "Premium"|"Regular"}))}>
            <option>Regular</option>
            <option>Premium</option>
          </select>
          <button type="submit" className="bg-green-800 hover:bg-green-900 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
            Register
          </button>
        </form>
        {msg && <p className="mt-2 text-sm text-green-700 font-medium">{msg}</p>}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Search className="w-4 h-4"/>Search Customer</h2>
        <div className="flex gap-2">
          <input placeholder="Customer ID" type="number" min={1} value={searchId} onChange={e => setSearchId(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 w-40 transition"/>
          <button onClick={doSearch} className="bg-green-800 hover:bg-green-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition">Search</button>
        </div>
        {found === "not-found" && <p className="mt-2 text-sm text-red-600 font-medium">Customer not found.</p>}
        {found && found !== "not-found" && (
          <div className="mt-3 bg-green-50 border border-green-100 rounded-lg px-4 py-2 text-sm text-green-800">
            ID: <b>{found.customerId}</b> · Name: <b>{found.name}</b> · Type: <b>{found.type}</b>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">All Customers ({customers.length})</h2>
        {customers.length === 0 ? <p className="text-slate-400 text-sm">No customers yet.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
              <th className="pb-2 pr-4 text-left font-medium">ID</th><th className="pb-2 pr-4 text-left font-medium">Name</th>
              <th className="pb-2 pr-4 text-left font-medium">Type</th><th className="pb-2 text-left font-medium">Action</th>
            </tr></thead>
            <tbody>{customers.map(c => (
              <tr key={c.customerId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                <td className="py-3 pr-4 font-semibold text-slate-800">{c.customerId}</td>
                <td className="py-3 pr-4 text-slate-600">{c.name}</td>
                <td className="py-3 pr-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.type === "Premium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                    {c.type}
                  </span>
                </td>
                <td className="py-3">
                  <button onClick={() => del(c.customerId)} className="text-red-400 hover:text-red-600 transition">
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
