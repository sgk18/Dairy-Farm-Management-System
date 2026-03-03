import { NextResponse } from "next/server";
import { store, Sale } from "@/lib/store";

function validateDate(date: string): boolean {
  const m = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return false;
  const [, dd, mm, yyyy] = m.map(Number);
  if (yyyy < 1900 || yyyy > 2100) return false;
  if (mm < 1 || mm > 12) return false;
  const isLeap = (yyyy % 4 === 0 && yyyy % 100 !== 0) || yyyy % 400 === 0;
  const maxDay = [0,31,isLeap?29:28,31,30,31,30,31,31,30,31,30,31];
  return dd >= 1 && dd <= maxDay[mm];
}

// GET – all sales, optional ?month=1-12 filter
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  let sales = store.sales;
  if (month) {
    const mm = String(Number(month)).padStart(2, "0");
    sales = sales.filter(s => s.date.slice(3, 5) === mm);
  }
  const total = sales.reduce((sum, s) => sum + s.revenue, 0);
  return NextResponse.json({ sales, total });
}

// POST – add sale
export async function POST(req: Request) {
  const { date, revenue }: Sale = await req.json();
  if (!validateDate(date))
    return NextResponse.json({ error: "Invalid date (DD/MM/YYYY)" }, { status: 400 });
  if (revenue == null || revenue < 0)
    return NextResponse.json({ error: "Invalid revenue" }, { status: 400 });
  store.sales.unshift({ date, revenue });
  return NextResponse.json({ ok: true });
}
