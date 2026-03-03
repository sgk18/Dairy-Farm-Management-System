import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(req: Request) {
  const { username, password } = await req.json();
  if (username === "admin" && password === "1234") {
    store.loggedIn = true;
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
}

export async function DELETE() {
  store.loggedIn = false;
  return NextResponse.json({ ok: true });
}
