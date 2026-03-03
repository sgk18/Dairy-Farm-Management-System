import { NextResponse } from "next/server";
import { store, Zone } from "@/lib/store";

// GET – list all zones in circular rotation order
export async function GET() {
  return NextResponse.json(store.zones);
}

// POST – add zone
export async function POST(req: Request) {
  const { zoneId, zoneName }: Zone = await req.json();
  if (!zoneId || !zoneName)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  store.zones.push({ zoneId, zoneName });
  return NextResponse.json({ ok: true });
}
