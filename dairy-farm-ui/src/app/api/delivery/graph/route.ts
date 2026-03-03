import { NextResponse } from "next/server";
import { store, MAX_NODES } from "@/lib/store";

// GET graph state
export async function GET() {
  return NextResponse.json({
    nodes: store.gNodes,
    edges: buildEdgeList(),
  });
}

function buildEdgeList() {
  const edges: { from: number; to: number; fromName: string; toName: string }[] = [];
  for (let i = 0; i < store.gNodes.length; i++)
    for (let j = i + 1; j < store.gNodes.length; j++)
      if (store.adjMatrix[i][j])
        edges.push({ from: i, to: j, fromName: store.gNodes[i].name, toName: store.gNodes[j].name });
  return edges;
}

// POST actions: addNode | addEdge | bfs
export async function POST(req: Request) {
  const body = await req.json();
  const { action } = body;

  if (action === "addNode") {
    if (store.gNodes.length >= MAX_NODES)
      return NextResponse.json({ error: "Max locations reached" }, { status: 400 });
    store.gNodes.push({ name: body.name });
    return NextResponse.json({ ok: true, index: store.gNodes.length - 1 });
  }

  if (action === "addEdge") {
    const u = body.from as number;
    const v = body.to as number;
    if (u < 0 || u >= store.gNodes.length || v < 0 || v >= store.gNodes.length || u === v)
      return NextResponse.json({ error: "Invalid nodes" }, { status: 400 });
    store.adjMatrix[u][v] = store.adjMatrix[v][u] = 1;
    return NextResponse.json({ ok: true });
  }

  if (action === "bfs") {
    const start = body.start as number;
    if (start < 0 || start >= store.gNodes.length)
      return NextResponse.json({ error: "Invalid start node" }, { status: 400 });
    const visited = Array(store.gNodes.length).fill(false);
    const queue: number[] = [start];
    const order: string[] = [];
    visited[start] = true;
    while (queue.length) {
      const u = queue.shift()!;
      order.push(store.gNodes[u].name);
      for (let v = 0; v < store.gNodes.length; v++)
        if (store.adjMatrix[u][v] && !visited[v]) { visited[v] = true; queue.push(v); }
    }
    return NextResponse.json({ ok: true, order });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
