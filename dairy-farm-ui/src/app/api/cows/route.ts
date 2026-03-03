import { NextResponse } from "next/server";
import { store, Cow } from "@/lib/store";

// GET all cows
export async function GET() {
  const sorted = [...store.cows].sort((a, b) => a.id - b.id);
  return NextResponse.json(sorted);
}

// POST – add cow
export async function POST(req: Request) {
  const body: Omit<Cow, never> = await req.json();
  const { id, breed, age, avgMilk } = body;

  if (!id || !breed || age == null || avgMilk == null)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (store.cows.find(c => c.id === id))
    return NextResponse.json({ error: `Cow #${id} already exists` }, { status: 409 });

  store.cows.push({ id, breed, age, avgMilk });
  return NextResponse.json({ ok: true });
}

// DELETE – remove cow by id (query param ?id=...)
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  const idx = store.cows.findIndex(c => c.id === id);
  if (idx === -1)
    return NextResponse.json({ error: `Cow #${id} not found` }, { status: 404 });
  const [removed] = store.cows.splice(idx, 1);
  return NextResponse.json({ ok: true, removed });
}
