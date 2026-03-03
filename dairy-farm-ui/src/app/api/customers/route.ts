import { NextResponse } from "next/server";
import { store, Customer } from "@/lib/store";

// GET – list all customers
export async function GET() {
  return NextResponse.json(Array.from(store.customers.values()));
}

// POST – add customer
export async function POST(req: Request) {
  const body: Customer = await req.json();
  const { customerId, name, type } = body;
  if (!customerId || !name || !type)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (store.customers.has(customerId))
    return NextResponse.json({ error: `Customer #${customerId} already exists` }, { status: 409 });
  store.customers.set(customerId, { customerId, name, type });
  return NextResponse.json({ ok: true });
}

// DELETE – remove customer by id
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!store.customers.has(id))
    return NextResponse.json({ error: `Customer #${id} not found` }, { status: 404 });
  store.customers.delete(id);
  return NextResponse.json({ ok: true });
}
