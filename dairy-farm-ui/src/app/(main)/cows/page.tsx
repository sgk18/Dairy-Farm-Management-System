"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Search, ArrowUpDown } from "lucide-react";

interface Cow { id: number; breed: string; age: number; avgMilk: number; }

export default function CowsPage() {
  const [cows, setCows]     = useState<Cow[]>([]);
  const [form, setForm]     = useState({ id: "", breed: "", age: "", avgMilk: "" });
  const [searchId, setSearchId] = useState("");
  const [found, setFound]   = useState<Cow | null | "not-found">(null);
  const [msg, setMsg]       = useState("");
  const [sorted, setSorted] = useState(false);

  const load = () => fetch("/api/cows").then(r => r.json()).then(setCows);
  useEffect(() => { load(); }, []);

  async function addCow(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/cows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: +form.id, breed: form.breed, age: +form.age, avgMilk: +form.avgMilk }),
    });
    const data = await res.json();
    setMsg(res.ok ? `Cow #${form.id} added!` : data.error);
    if (res.ok) { setForm({ id:"", breed:"", age:"", avgMilk:"" }); load(); }
  }

  async function deleteCow(id: number) {
    const res = await fetch(`/api/cows?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    setMsg(res.ok ? `Cow #${id} removed.` : data.error);
    load();
  }

  function doSearch() {
    const id = parseInt(searchId);
    const c = cows.find(c => c.id === id);
    setFound(c ?? "not-found");
  }

  const display = sorted
    ? [...cows].sort((a, b) => b.avgMilk - a.avgMilk)
    : cows;

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-6">Cattle Registry</h1>

      {/* Add Cow */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><Plus className="w-4 h-4"/>Register Cow</h2>
        <form onSubmit={addCow} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(["id","breed","age","avgMilk"] as const).map(f => (
            <input key={f} required placeholder={f === "avgMilk" ? "Avg Milk (L/day)" : f.charAt(0).toUpperCase()+f.slice(1)}
              type={["id","age","avgMilk"].includes(f) ? "number" : "text"}
              min={["id","age"].includes(f) ? 1 : undefined} step={f === "avgMilk" ? "0.01" : undefined}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
              value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
            />
          ))}
          <button type="submit" className="lg:col-span-4 bg-green-800 hover:bg-green-900 text-white py-2 rounded-lg text-sm font-medium transition">
            Add Cow
          </button>
        </form>
        {msg && <p className="mt-2 text-sm text-green-700 font-medium">{msg}</p>}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Search className="w-4 h-4"/>Search by ID (BST)</h2>
        <div className="flex gap-2">
          <input placeholder="Cow ID" type="number" min={1} value={searchId} onChange={e => setSearchId(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 w-40 transition"/>
          <button onClick={doSearch} className="bg-green-800 hover:bg-green-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition">Search</button>
        </div>
        {found === "not-found" && <p className="mt-2 text-sm text-red-600 font-medium">Cow not found.</p>}
        {found && found !== "not-found" && (
          <div className="mt-3 bg-green-50 border border-green-100 rounded-lg px-4 py-2 text-sm text-green-800">
            ID: <b>{found.id}</b> · Breed: <b>{found.breed}</b> · Age: <b>{found.age}</b> · Avg Milk: <b>{found.avgMilk.toFixed(2)} L/day</b>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">All Cows ({cows.length})</h2>
          <button onClick={() => setSorted(s => !s)}
            className="flex items-center gap-1 text-xs font-medium text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition">
            <ArrowUpDown className="w-3 h-3"/>
            {sorted ? "Unsort" : "Sort by Milk ↓"}
          </button>
        </div>
        {cows.length === 0 ? <p className="text-slate-400 text-sm">No cows on record.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                {sorted && <th className="pb-2 pr-4 text-left font-medium">Rank</th>}
                <th className="pb-2 pr-4 text-left font-medium">ID</th><th className="pb-2 pr-4 text-left font-medium">Breed</th>
                <th className="pb-2 pr-4 text-left font-medium">Age</th><th className="pb-2 pr-4 text-left font-medium">Avg Milk</th><th className="pb-2 text-left font-medium">Action</th>
              </tr></thead>
              <tbody>{display.map((c, i) => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                  {sorted && <td className="py-3 pr-4 text-slate-400">{i+1}</td>}
                  <td className="py-3 pr-4 font-semibold text-slate-800">{c.id}</td>
                  <td className="py-3 pr-4 text-slate-600">{c.breed}</td>
                  <td className="py-3 pr-4 text-slate-600">{c.age} yrs</td>
                  <td className="py-3 pr-4 text-slate-600">{c.avgMilk.toFixed(2)} L</td>
                  <td className="py-3">
                    <button onClick={() => deleteCow(c.id)} className="text-red-400 hover:text-red-600 transition">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
