import { NextResponse } from "next/server";
import { store } from "@/lib/store";

// GET – list all milk entries (top of stack first)
export async function GET() {
  return NextResponse.json({
    entries: [...store.milkStack].reverse(),   // display LIFO order
    total: store.milkStack.reduce((s, v) => s + v, 0),
  });
}

// POST – push milk entry
export async function POST(req: Request) {
  const { quantity } = await req.json();
  if (quantity == null || quantity < 0)
    return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
  store.milkStack.push(quantity);
  return NextResponse.json({ ok: true, total: store.milkStack.reduce((s, v) => s + v, 0) });
}
