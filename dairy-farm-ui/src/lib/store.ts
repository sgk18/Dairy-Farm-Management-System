/* ============================================================
 *  In-memory store – replicates the C program's global state
 *  Module-level singleton: persists across API requests within
 *  the same Node.js process (Next.js dev server).
 * ============================================================ */

export interface Cow {
  id: number;
  breed: string;
  age: number;
  avgMilk: number;
}

export interface Customer {
  customerId: number;
  name: string;
  type: "Premium" | "Regular";
}

export interface Order {
  id: number;        // customer id
  name: string;
  quantity: number;
  total: number;
  priority: 1 | 2;  // 1 = Premium, 2 = Regular
}

export interface Zone {
  zoneId: number;
  zoneName: string;
}

export interface GNode {
  name: string;
}

export interface Sale {
  date: string;       // DD/MM/YYYY
  revenue: number;
}

interface Store {
  cows: Cow[];
  milkStack: number[];      // quantities pushed (LIFO)
  customers: Map<number, Customer>;
  orders: Order[];
  zones: Zone[];
  gNodes: GNode[];
  adjMatrix: number[][];
  sales: Sale[];
  loggedIn: boolean;
}

const MAX_NODES = 10;
const RATE      = 50;
const GST       = 0.05;

function initMatrix(): number[][] {
  return Array.from({ length: MAX_NODES }, () => Array(MAX_NODES).fill(0));
}

// module-level singleton
const store: Store = {
  cows:       [],
  milkStack:  [],
  customers:  new Map(),
  orders:     [],
  zones:      [],
  gNodes:     [],
  adjMatrix:  initMatrix(),
  sales:      [],
  loggedIn:   false,
};

export { store, RATE, GST, MAX_NODES };
