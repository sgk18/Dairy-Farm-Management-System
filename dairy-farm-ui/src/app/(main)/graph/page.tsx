"use client";
import { useEffect, useState } from "react";
import { MapPin, Plus, Network, Search } from "lucide-react";

interface GNode { name: string; }
interface Edge   { from: number; to: number; fromName: string; toName: string; }

export default function GraphPage() {
  const [nodes, setNodes]   = useState<GNode[]>([]);
  const [edges, setEdges]   = useState<Edge[]>([]);
  const [nodeName, setNodeName] = useState("");
  const [fromNode, setFromNode] = useState("");
  const [toNode, setToNode]     = useState("");
  const [bfsStart, setBfsStart] = useState("");
  const [bfsResult, setBfsResult] = useState<string[]>([]);
  const [msg, setMsg]           = useState("");

  const load = () =>
    fetch("/api/delivery/graph").then(r => r.json()).then(d => {
      setNodes(d.nodes); setEdges(d.edges);
    });
  useEffect(() => { load(); }, []);

  async function addNode(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/delivery/graph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addNode", name: nodeName }),
    });
    const data = await res.json();
    setMsg(res.ok ? `'${nodeName}' added as Node [${data.index + 1}]` : data.error);
    if (res.ok) { setNodeName(""); load(); }
  }

  async function addEdge(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/delivery/graph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addEdge", from: +fromNode - 1, to: +toNode - 1 }),
    });
    const data = await res.json();
    setMsg(res.ok ? `Route added: ${nodes[+fromNode-1]?.name} ↔ ${nodes[+toNode-1]?.name}` : data.error);
    if (res.ok) { setFromNode(""); setToNode(""); load(); }
  }

  async function doBFS(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/delivery/graph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bfs", start: +bfsStart - 1 }),
    });
    const data = await res.json();
    if (res.ok) setBfsResult(data.order);
    else setMsg(data.error);
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-6">Route Graph + BFS</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Add Node */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Plus className="w-4 h-4"/>Add Location (Node)</h2>
          <form onSubmit={addNode} className="flex gap-2">
            <input required placeholder="Location name"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 flex-1 transition"
              value={nodeName} onChange={e => setNodeName(e.target.value)}/>
            <button type="submit" className="bg-green-800 hover:bg-green-900 text-white px-3 py-2 rounded-lg text-sm font-medium transition">Add</button>
          </form>
        </div>

        {/* Add Edge */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Network className="w-4 h-4"/>Add Route (Edge)</h2>
          <form onSubmit={addEdge} className="flex gap-2">
            <input required type="number" min={1} max={nodes.length} placeholder="From #"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 w-20 transition"
              value={fromNode} onChange={e => setFromNode(e.target.value)}/>
            <input required type="number" min={1} max={nodes.length} placeholder="To #"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 w-20 transition"
              value={toNode} onChange={e => setToNode(e.target.value)}/>
            <button type="submit" className="bg-green-800 hover:bg-green-900 text-white px-3 py-2 rounded-lg text-sm font-medium transition">Add</button>
          </form>
        </div>

        {/* BFS */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Search className="w-4 h-4"/>BFS Traversal</h2>
          <form onSubmit={doBFS} className="flex gap-2">
            <input required type="number" min={1} max={nodes.length} placeholder="Start node #"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 flex-1 transition"
              value={bfsStart} onChange={e => setBfsStart(e.target.value)}/>
            <button type="submit" className="bg-green-800 hover:bg-green-900 text-white px-3 py-2 rounded-lg text-sm font-medium transition">BFS</button>
          </form>
        </div>
      </div>

      {msg && <p className="text-sm text-slate-600 mb-4">{msg}</p>}

      {bfsResult.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
          <p className="text-xs text-green-700 font-semibold mb-2">BFS ORDER:</p>
          <div className="flex flex-wrap gap-2">
            {bfsResult.map((n, i) => (
              <span key={i} className="flex items-center gap-1 text-sm">
                {i > 0 && <span className="text-green-300">→</span>}
                <span className="bg-green-800 text-white px-2 py-0.5 rounded-full text-xs font-semibold">{n}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Nodes */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Locations ({nodes.length} / 10)</h2>
          {nodes.length === 0 ? <p className="text-slate-400 text-sm">No locations.</p> : (
            <div className="space-y-2">
              {nodes.map((n, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg text-sm border border-slate-100">
                  <span className="text-slate-400 w-6 font-mono">[{i+1}]</span>
                  <span className="font-medium text-slate-800">{n.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edges */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Routes ({edges.length})</h2>
          {edges.length === 0 ? <p className="text-slate-400 text-sm">No routes.</p> : (
            <div className="space-y-2">
              {edges.map((e, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm border border-slate-100">
                  <span className="text-green-700 font-medium">{e.fromName}</span>
                  <span className="text-slate-400">↔</span>
                  <span className="text-green-700 font-medium">{e.toName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
