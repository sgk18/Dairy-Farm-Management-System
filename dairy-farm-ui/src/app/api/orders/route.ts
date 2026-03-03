import { NextResponse } from "next/server";
import { store, Order, RATE, GST } from "@/lib/store";

function insertByPriority(orders: Order[], order: Order) {
  const idx = orders.findIndex(o => o.priority > order.priority);
  if (idx === -1) orders.push(order);
  else orders.splice(idx, 0, order);
}

// GET – list pending orders
export async function GET() {
  return NextResponse.json(store.orders);
}

// POST – place order
export async function POST(req: Request) {
  const { customerId, quantity } = await req.json();
  const cust = store.customers.get(customerId);

  let priority: 1 | 2 = 2;
  let name = `Customer #${customerId}`;
  if (cust) {
    priority = cust.type === "Premium" ? 1 : 2;
    name = cust.name;
  }

  const sub   = quantity * RATE;
  const total = sub + sub * GST;

  const order: Order = { id: customerId, name, quantity, total, priority };
  insertByPriority(store.orders, order);
  return NextResponse.json({ ok: true, total, priority });
}

// DELETE – cancel order by customer id
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  const idx = store.orders.findIndex(o => o.id === id);
  if (idx === -1)
    return NextResponse.json({ error: `No order for customer #${id}` }, { status: 404 });
  store.orders.splice(idx, 1);
  return NextResponse.json({ ok: true });
}
