import { promises as fs } from "fs";
import path from "path";
import { MASTER_INVENTORY } from "@/src/lib/jordan-books/matrix/master-inventory";
import type { InventoryCell, MatrixStatus, QueueItem } from "@/src/lib/jordan-books/matrix/types";

const STORE = path.join(process.cwd(), "data/jordan-books/production-queue.json");

export type ProductionStore = {
  updatedAt: string;
  cells: InventoryCell[];
  queue: QueueItem[];
  processedBookIds: string[];
};

function priorityFor(cell: InventoryCell): number {
  // Lower = sooner. G1 Sem1 companions first, then G1 Sem2, then KG, then grade order.
  let p = 5000;
  if (cell.bookType !== "sos_companion") p += 2000;
  if (cell.gradeKey === "1" && cell.semester === "1") p = 100;
  else if (cell.gradeKey === "1" && cell.semester === "2") p = 200;
  else if (cell.gradeKey === "kg") p = 300;
  else if (cell.gradeKey === "2") p = 400;
  else if (cell.gradeKey.startsWith("1")) p = 800 + Number(cell.gradeKey.replace(/\D/g, "") || 11) * 10;
  else p = 500 + Number(cell.gradeKey.replace(/\D/g, "") || 9) * 20;
  if (cell.subjectSlug === "math") p -= 5;
  if (cell.matrixStatus === "CONTENT_COMPLETE") p += 10000;
  if (cell.matrixStatus === "NOT_DISCOVERED") p += 50000;
  return p;
}

export async function loadProductionStore(): Promise<ProductionStore> {
  try {
    const raw = await fs.readFile(STORE, "utf8");
    return JSON.parse(raw) as ProductionStore;
  } catch {
    const cells = MASTER_INVENTORY.map((c) => ({ ...c }));
    const queue: QueueItem[] = cells
      .filter((c) => c.bookType === "sos_companion" && c.matrixStatus !== "NOT_DISCOVERED")
      .map((c) => ({
        cellId: c.id,
        priority: priorityFor(c),
        enqueuedAt: new Date().toISOString(),
        attempts: 0,
        state: (c.matrixStatus === "CONTENT_COMPLETE" ? "done" : "pending") as QueueItem["state"],
      }))
      .sort((a, b) => a.priority - b.priority);
    const store: ProductionStore = {
      updatedAt: new Date().toISOString(),
      cells,
      queue,
      processedBookIds: cells.filter((c) => c.structuredBookId).map((c) => c.structuredBookId!),
    };
    await saveProductionStore(store);
    return store;
  }
}

export async function saveProductionStore(store: ProductionStore): Promise<void> {
  store.updatedAt = new Date().toISOString();
  await fs.mkdir(path.dirname(STORE), { recursive: true });
  await fs.writeFile(STORE, JSON.stringify(store, null, 2), "utf8");
}

export async function updateCellStatus(
  cellId: string,
  matrixStatus: MatrixStatus,
  patch: Partial<InventoryCell> = {},
): Promise<ProductionStore> {
  const store = await loadProductionStore();
  store.cells = store.cells.map((c) => (c.id === cellId ? { ...c, ...patch, matrixStatus } : c));
  store.queue = store.queue.map((q) => {
    if (q.cellId !== cellId) return q;
    if (matrixStatus === "BLOCKED") return { ...q, state: "blocked" };
    if (["CONTENT_COMPLETE", "PUBLISHED", "COMPLETE"].includes(matrixStatus)) return { ...q, state: "done" };
    return q;
  });
  await saveProductionStore(store);
  return store;
}
