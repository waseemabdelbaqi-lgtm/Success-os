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
  // Lower = sooner. Execution order: KG → G1 → … → G12
  let p = 5000;
  if (cell.bookType !== "sos_companion") p += 2000;
  if (cell.gradeKey === "kg1") p = 50;
  else if (cell.gradeKey === "kg2") p = 60;
  else if (cell.gradeKey === "1" && cell.semester === "1") p = 100;
  else if (cell.gradeKey === "1" && cell.semester === "2") p = 200;
  else if (cell.gradeKey === "2") p = 300 + (cell.semester === "2" ? 20 : 0);
  else if (cell.gradeKey === "12") p = 1200 + (cell.semester === "2" ? 20 : 0);
  else if (cell.gradeKey.startsWith("1") && cell.gradeKey.length > 1)
    p = 800 + Number(cell.gradeKey.replace(/\D/g, "") || 11) * 10;
  else p = 400 + Number(cell.gradeKey.replace(/\D/g, "") || 9) * 30;
  if (cell.subjectSlug === "math") p -= 5;
  if (cell.matrixStatus === "CONTENT_COMPLETE") p += 10000;
  if (cell.matrixStatus === "NOT_DISCOVERED") p += 50000;
  return p;
}

function buildFreshStore(preserve?: ProductionStore): ProductionStore {
  const previousById = new Map((preserve?.cells || []).map((c) => [c.id, c]));
  const cells = MASTER_INVENTORY.map((c) => {
    const prev = previousById.get(c.id);
    if (!prev) return { ...c };
    // Preserve production progress for known cells
    return {
      ...c,
      matrixStatus: prev.matrixStatus !== "QUEUED" && prev.matrixStatus !== "DISCOVERED" ? prev.matrixStatus : c.matrixStatus,
      structuredBookId: prev.structuredBookId || c.structuredBookId,
      unitsDone: prev.unitsDone ?? c.unitsDone,
      lessonsDone: prev.lessonsDone ?? c.lessonsDone,
      exercisesDone: prev.exercisesDone ?? c.exercisesDone,
      answersDone: prev.answersDone ?? c.answersDone,
      blocker: c.matrixStatus === "NOT_DISCOVERED" ? c.blocker : prev.blocker ?? c.blocker,
    };
  });

  const prevQueue = new Map((preserve?.queue || []).map((q) => [q.cellId, q]));
  const queue: QueueItem[] = cells
    .filter((c) => c.bookType === "sos_companion" && c.matrixStatus !== "NOT_DISCOVERED")
    .map((c) => {
      const old = prevQueue.get(c.id);
      const done =
        c.matrixStatus === "CONTENT_COMPLETE" ||
        c.matrixStatus === "STRUCTURED" ||
        old?.state === "done";
      return {
        cellId: c.id,
        priority: priorityFor(c),
        enqueuedAt: old?.enqueuedAt || new Date().toISOString(),
        attempts: old?.attempts || 0,
        state: (done ? "done" : old?.state === "blocked" ? "blocked" : "pending") as QueueItem["state"],
        lastError: old?.lastError,
      };
    })
    .sort((a, b) => a.priority - b.priority);

  return {
    updatedAt: new Date().toISOString(),
    cells,
    queue,
    processedBookIds: Array.from(
      new Set([
        ...(preserve?.processedBookIds || []),
        ...cells.filter((c) => c.structuredBookId).map((c) => c.structuredBookId!),
      ]),
    ),
  };
}

export async function loadProductionStore(): Promise<ProductionStore> {
  try {
    const raw = await fs.readFile(STORE, "utf8");
    return JSON.parse(raw) as ProductionStore;
  } catch {
    const store = buildFreshStore();
    await saveProductionStore(store);
    return store;
  }
}

/** Rebuild queue from master inventory while preserving progress on overlapping cell ids. */
export async function rebuildProductionStore(): Promise<ProductionStore> {
  let previous: ProductionStore | undefined;
  try {
    const raw = await fs.readFile(STORE, "utf8");
    previous = JSON.parse(raw) as ProductionStore;
  } catch {
    previous = undefined;
  }
  const store = buildFreshStore(previous);
  await saveProductionStore(store);
  return store;
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
