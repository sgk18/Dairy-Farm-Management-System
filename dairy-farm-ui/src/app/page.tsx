"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (res.ok) router.push("/dashboard");
    else setError("Invalid credentials. Hint: admin / 1234");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-full bg-green-800 flex items-center justify-center">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900">MILK IT</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest">Dairy Systems</p>
          </div>
          <p className="text-sm text-slate-500 text-center">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
              value={username} onChange={e => setUsername(e.target.value)}
              placeholder="admin" required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••" required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-green-800 hover:bg-green-900 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}


