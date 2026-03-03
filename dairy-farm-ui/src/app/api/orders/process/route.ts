import { NextResponse } from "next/server";
import { store } from "@/lib/store";

// POST – dequeue and process highest-priority order
export async function POST() {
  if (store.orders.length === 0)
    return NextResponse.json({ error: "No orders in queue" }, { status: 404 });
  const processed = store.orders.shift()!;
  return NextResponse.json({ ok: true, processed });
}
