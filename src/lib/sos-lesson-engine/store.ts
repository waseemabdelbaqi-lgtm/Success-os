import { promises as fs } from "fs";
import path from "path";
import type {
  AssignmentRecord,
  CollaborativeBoard,
  LiveSession,
  MasteryRecord,
  ReviewGameSession,
  AITutorTurn,
} from "@/src/lib/sos-lesson-engine/schema/types";

const ROOT = path.join(process.cwd(), "data/sos-lesson-engine");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(ROOT, file), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(ROOT, { recursive: true });
  await fs.writeFile(path.join(ROOT, file), JSON.stringify(data, null, 2), "utf8");
}

function code(n = 6): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < n; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export async function getMastery(studentKey: string, lessonId: string): Promise<MasteryRecord | null> {
  const all = await readJson<MasteryRecord[]>("mastery.json", []);
  return all.find((m) => m.studentKey === studentKey && m.lessonId === lessonId) || null;
}

export async function upsertMastery(record: MasteryRecord): Promise<MasteryRecord> {
  const all = await readJson<MasteryRecord[]>("mastery.json", []);
  const idx = all.findIndex((m) => m.studentKey === record.studentKey && m.lessonId === record.lessonId);
  if (idx >= 0) all[idx] = record;
  else all.push(record);
  await writeJson("mastery.json", all);
  return record;
}

export async function createLiveSession(lessonId: string, teacherKey: string): Promise<LiveSession> {
  const sessions = await readJson<LiveSession[]>("live-sessions.json", []);
  const session: LiveSession = {
    id: `live-${Date.now()}`,
    joinCode: code(5),
    lessonId,
    teacherKey,
    status: "lobby",
    currentStageId: "identity",
    lockStudentNav: true,
    participants: [],
    responses: [],
    points: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  sessions.push(session);
  await writeJson("live-sessions.json", sessions);
  return session;
}

export async function getLiveByCode(joinCode: string): Promise<LiveSession | null> {
  const sessions = await readJson<LiveSession[]>("live-sessions.json", []);
  return sessions.find((s) => s.joinCode.toUpperCase() === joinCode.toUpperCase() && s.status !== "ended") || null;
}

export async function getLiveById(id: string): Promise<LiveSession | null> {
  const sessions = await readJson<LiveSession[]>("live-sessions.json", []);
  return sessions.find((s) => s.id === id) || null;
}

export async function updateLiveSession(
  id: string,
  patch: Partial<LiveSession>,
): Promise<LiveSession | null> {
  const sessions = await readJson<LiveSession[]>("live-sessions.json", []);
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  sessions[idx] = { ...sessions[idx]!, ...patch, updatedAt: new Date().toISOString() };
  await writeJson("live-sessions.json", sessions);
  return sessions[idx]!;
}

export async function getOrCreateBoard(
  lessonId: string,
  promptAr: string,
  boardType: CollaborativeBoard["boardType"],
  moderationRequired: boolean,
): Promise<CollaborativeBoard> {
  const boards = await readJson<CollaborativeBoard[]>("boards.json", []);
  const existing = boards.find((b) => b.lessonId === lessonId);
  if (existing) return existing;
  const board: CollaborativeBoard = {
    id: `board-${lessonId}`,
    lessonId,
    boardType,
    promptAr,
    posts: [],
    moderationRequired,
    createdAt: new Date().toISOString(),
  };
  boards.push(board);
  await writeJson("boards.json", boards);
  return board;
}

export async function addBoardPost(
  boardId: string,
  post: Omit<CollaborativeBoard["posts"][number], "id" | "createdAt" | "reactions" | "approved"> & {
    approved?: boolean;
  },
): Promise<CollaborativeBoard | null> {
  const boards = await readJson<CollaborativeBoard[]>("boards.json", []);
  const idx = boards.findIndex((b) => b.id === boardId);
  if (idx < 0) return null;
  const board = boards[idx]!;
  board.posts.push({
    id: `post-${Date.now()}`,
    authorKey: post.authorKey,
    displayName: post.displayName,
    anonymous: post.anonymous,
    bodyAr: post.bodyAr.slice(0, 500),
    approved: post.approved ?? !board.moderationRequired,
    createdAt: new Date().toISOString(),
    reactions: {},
  });
  await writeJson("boards.json", boards);
  return board;
}

export async function createReviewGame(
  lessonId: string,
  opts: Partial<ReviewGameSession> = {},
): Promise<ReviewGameSession> {
  const games = await readJson<ReviewGameSession[]>("review-games.json", []);
  const game: ReviewGameSession = {
    id: `game-${Date.now()}`,
    joinCode: code(5),
    lessonId,
    mode: opts.mode || "individual",
    status: "lobby",
    questionIndex: 0,
    timerEnabled: opts.timerEnabled ?? false,
    speedPointsEnabled: opts.speedPointsEnabled ?? false,
    leaderboardEnabled: opts.leaderboardEnabled ?? true,
    musicEnabled: false,
    accessibilityUntimed: opts.accessibilityUntimed ?? true,
    participants: [],
    answers: [],
    createdAt: new Date().toISOString(),
  };
  games.push(game);
  await writeJson("review-games.json", games);
  return game;
}

export async function getReviewGame(id: string): Promise<ReviewGameSession | null> {
  const games = await readJson<ReviewGameSession[]>("review-games.json", []);
  return games.find((g) => g.id === id) || null;
}

export async function getReviewGameByCode(joinCode: string): Promise<ReviewGameSession | null> {
  const games = await readJson<ReviewGameSession[]>("review-games.json", []);
  return games.find((g) => g.joinCode.toUpperCase() === joinCode.toUpperCase() && g.status !== "ended") || null;
}

export async function updateReviewGame(
  id: string,
  patch: Partial<ReviewGameSession>,
): Promise<ReviewGameSession | null> {
  const games = await readJson<ReviewGameSession[]>("review-games.json", []);
  const idx = games.findIndex((g) => g.id === id);
  if (idx < 0) return null;
  games[idx] = { ...games[idx]!, ...patch };
  await writeJson("review-games.json", games);
  return games[idx]!;
}

export async function createAssignment(input: Omit<AssignmentRecord, "id" | "createdAt">): Promise<AssignmentRecord> {
  const all = await readJson<AssignmentRecord[]>("assignments.json", []);
  const row: AssignmentRecord = { ...input, id: `asg-${Date.now()}`, createdAt: new Date().toISOString() };
  all.push(row);
  await writeJson("assignments.json", all);
  return row;
}

export async function listAssignments(lessonId?: string): Promise<AssignmentRecord[]> {
  const all = await readJson<AssignmentRecord[]>("assignments.json", []);
  return lessonId ? all.filter((a) => a.lessonId === lessonId) : all;
}

export async function appendTutorTurn(turn: Omit<AITutorTurn, "id" | "createdAt">): Promise<AITutorTurn> {
  const all = await readJson<AITutorTurn[]>("ai-tutor.json", []);
  const row: AITutorTurn = { ...turn, id: `ai-${Date.now()}`, createdAt: new Date().toISOString() };
  all.push(row);
  await writeJson("ai-tutor.json", all.slice(-500));
  return row;
}

export async function listMasteryByLesson(lessonId: string): Promise<MasteryRecord[]> {
  const all = await readJson<MasteryRecord[]>("mastery.json", []);
  return all.filter((m) => m.lessonId === lessonId);
}
