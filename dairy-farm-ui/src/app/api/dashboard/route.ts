import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const totalMilk = store.milkStack.reduce((s, v) => s + v, 0);
  return NextResponse.json({
    cows:              store.cows.length,
    totalMilk,
    pendingOrders:     store.orders.length,
    deliveryZones:     store.zones.length,
    deliveryLocations: store.gNodes.length,
    customers:         store.customers.size,
  });
}
