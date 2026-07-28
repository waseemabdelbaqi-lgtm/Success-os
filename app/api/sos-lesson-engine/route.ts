import { NextResponse } from "next/server";
import {
  getInteractiveLesson,
  listInteractiveLessons,
  validateInteractiveLesson,
} from "@/src/lib/sos-lesson-engine/registry";
import { askLessonTutor } from "@/src/lib/sos-lesson-engine/ai/tutor";
import {
  addBoardPost,
  createAssignment,
  createLiveSession,
  createReviewGame,
  getLiveByCode,
  getLiveById,
  getOrCreateBoard,
  getReviewGame,
  getReviewGameByCode,
  listAssignments,
  listMasteryByLesson,
  updateLiveSession,
  updateReviewGame,
  upsertMastery,
} from "@/src/lib/sos-lesson-engine/store";
import type { LiveSession, MasteryRecord, ReviewGameSession } from "@/src/lib/sos-lesson-engine/schema/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "lessons";

  if (view === "lessons") {
    const lessons = listInteractiveLessons();
    return NextResponse.json({
      ok: true,
      count: lessons.length,
      lessons: lessons.map((l) => ({
        id: l.id,
        titleAr: l.identity.lessonTitleAr,
        bookId: l.identity.bookId,
        lessonId: l.identity.lessonId,
        validation: validateInteractiveLesson(l),
      })),
      honestNote: "Engine ships with complete reference lesson; queue expands coverage.",
      externalPlatforms: "Not embedded. Native Success OS alternatives only.",
    });
  }

  if (view === "lesson") {
    const id = searchParams.get("id") || "";
    const lesson = getInteractiveLesson(id);
    if (!lesson) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, lesson, validation: validateInteractiveLesson(lesson) });
  }

  if (view === "live") {
    const id = searchParams.get("id") || "";
    const session = await getLiveById(id);
    if (!session) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, session });
  }

  if (view === "board") {
    const lessonId = searchParams.get("lessonId") || "";
    const lesson = getInteractiveLesson(lessonId);
    if (!lesson) return NextResponse.json({ ok: false, error: "lesson_not_found" }, { status: 404 });
    const board = await getOrCreateBoard(
      lesson.id,
      lesson.collaboration.promptAr,
      lesson.collaboration.boardType,
      lesson.collaboration.moderationRequired,
    );
    return NextResponse.json({ ok: true, board });
  }

  if (view === "review_game") {
    const id = searchParams.get("id") || "";
    const game = await getReviewGame(id);
    if (!game) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, game });
  }

  if (view === "report") {
    const lessonId = searchParams.get("lessonId") || listInteractiveLessons()[0]?.id || "";
    const mastery = await listMasteryByLesson(lessonId);
    const assignments = await listAssignments(lessonId);
    return NextResponse.json({
      ok: true,
      lessonId,
      studentReports: mastery,
      assignments,
      teacherSummary: {
        learners: mastery.length,
        avgMastery:
          mastery.length === 0
            ? 0
            : Math.round((mastery.reduce((n, m) => n + m.lessonMastery, 0) / mastery.length) * 100),
        needingSupport: mastery.filter((m) => m.lessonMastery < 0.5).map((m) => m.studentKey),
      },
      adminSummary: {
        interactiveLessons: listInteractiveLessons().length,
        videoTeacherDisabled: true,
      },
    });
  }

  return NextResponse.json({ ok: false, error: "unknown_view" }, { status: 400 });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const action = String(body.action || "");

  if (action === "save_mastery") {
    const record = body.record as MasteryRecord;
    const saved = await upsertMastery(record);
    return NextResponse.json({ ok: true, record: saved });
  }

  if (action === "ai_tutor") {
    const lesson = getInteractiveLesson(String(body.lessonId || ""));
    if (!lesson) return NextResponse.json({ ok: false, error: "lesson_not_found" }, { status: 404 });
    const result = await askLessonTutor({
      lesson,
      studentKey: String(body.studentKey || "student"),
      stageId: body.stageId as never,
      userMessage: String(body.userMessage || ""),
      attemptMade: Boolean(body.attemptMade),
      lastAnswerCorrect: (body.lastAnswerCorrect as boolean | null) ?? null,
    });
    return NextResponse.json({ ok: true, ...result });
  }

  if (action === "create_live") {
    const session = await createLiveSession(String(body.lessonId), String(body.teacherKey || "teacher"));
    return NextResponse.json({ ok: true, session });
  }

  if (action === "update_live") {
    const session = await updateLiveSession(String(body.sessionId), body.patch as Partial<LiveSession>);
    if (!session) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, session });
  }

  if (action === "join_live") {
    const session = await getLiveByCode(String(body.joinCode || ""));
    if (!session) return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 404 });
    const participantId = String(body.participantId || `p-${Date.now()}`);
    const displayName = String(body.displayName || "طالب").slice(0, 40);
    if (!session.participants.some((p) => p.id === participantId)) {
      session.participants.push({ id: participantId, displayName, joinedAt: new Date().toISOString() });
      session.points[participantId] = session.points[participantId] || 0;
    }
    const saved = await updateLiveSession(session.id, {
      participants: session.participants,
      points: session.points,
    });
    return NextResponse.json({ ok: true, session: saved, participantId });
  }

  if (action === "live_response") {
    const session = await getLiveById(String(body.sessionId || ""));
    if (!session) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    session.responses.push({
      participantId: String(body.participantId),
      questionId: String(body.questionId),
      answer: String(body.answer).slice(0, 200),
      correct: Boolean(body.correct),
      at: new Date().toISOString(),
    });
    if (body.correct) {
      session.points[String(body.participantId)] = (session.points[String(body.participantId)] || 0) + 10;
    }
    const saved = await updateLiveSession(session.id, {
      responses: session.responses,
      points: session.points,
    });
    return NextResponse.json({ ok: true, session: saved });
  }

  if (action === "ensure_board") {
    const board = await getOrCreateBoard(
      String(body.lessonId),
      String(body.promptAr || ""),
      body.boardType as never,
      Boolean(body.moderationRequired),
    );
    return NextResponse.json({ ok: true, board });
  }

  if (action === "board_post") {
    const lessonId = String(body.lessonId);
    const lesson = getInteractiveLesson(lessonId);
    if (!lesson) return NextResponse.json({ ok: false, error: "lesson_not_found" }, { status: 404 });
    const board = await getOrCreateBoard(
      lesson.id,
      lesson.collaboration.promptAr,
      lesson.collaboration.boardType,
      lesson.collaboration.moderationRequired,
    );
    const updated = await addBoardPost(board.id, {
      authorKey: String(body.authorKey || "student"),
      displayName: String(body.displayName || "طالب").slice(0, 40),
      anonymous: Boolean(body.anonymous),
      bodyAr: String(body.bodyAr || ""),
    });
    return NextResponse.json({ ok: true, board: updated });
  }

  if (action === "create_review_game") {
    const game = await createReviewGame(String(body.lessonId), {
      timerEnabled: Boolean(body.timerEnabled),
      speedPointsEnabled: Boolean(body.speedPointsEnabled),
      leaderboardEnabled: body.leaderboardEnabled !== false,
      accessibilityUntimed: body.accessibilityUntimed !== false,
      mode: (body.mode as ReviewGameSession["mode"]) || "individual",
    });
    return NextResponse.json({ ok: true, game });
  }

  if (action === "join_review_game") {
    const game = await getReviewGameByCode(String(body.joinCode || ""));
    if (!game) return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 404 });
    const participantId = String(body.participantId || `g-${Date.now()}`);
    if (!game.participants.some((p) => p.id === participantId)) {
      game.participants.push({
        id: participantId,
        displayName: String(body.displayName || "لاعب").slice(0, 40),
        score: 0,
        streak: 0,
        correct: 0,
      });
    }
    const saved = await updateReviewGame(game.id, { participants: game.participants });
    return NextResponse.json({ ok: true, game: saved });
  }

  if (action === "update_review_game") {
    const game = await updateReviewGame(String(body.gameId), body.patch as Partial<ReviewGameSession>);
    if (!game) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, game });
  }

  if (action === "review_game_answer") {
    const game = await getReviewGame(String(body.gameId || ""));
    if (!game) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    const pid = String(body.participantId);
    const correct = Boolean(body.correct);
    game.answers.push({
      participantId: pid,
      questionId: String(body.questionId),
      correct,
      ms: Number(body.ms || 0),
    });
    game.participants = game.participants.map((p) => {
      if (p.id !== pid) return p;
      const add = correct ? 100 + (game.speedPointsEnabled ? 0 : 0) : 0;
      return {
        ...p,
        score: p.score + add,
        streak: correct ? p.streak + 1 : 0,
        correct: p.correct + (correct ? 1 : 0),
      };
    });
    const saved = await updateReviewGame(game.id, {
      answers: game.answers,
      participants: game.participants,
    });
    return NextResponse.json({ ok: true, game: saved });
  }

  if (action === "create_assignment") {
    const row = await createAssignment({
      lessonId: String(body.lessonId),
      teacherKey: String(body.teacherKey || "teacher"),
      groupLabel: String(body.groupLabel || "الصف"),
      startAt: String(body.startAt || new Date().toISOString()),
      dueAt: String(body.dueAt || new Date(Date.now() + 7 * 864e5).toISOString()),
      allowedAttempts: Number(body.allowedAttempts || 2),
      requiredScorePercent: Number(body.requiredScorePercent || 70),
      feedbackMode: (body.feedbackMode as "immediate" | "after_due" | "manual") || "immediate",
    });
    return NextResponse.json({ ok: true, assignment: row });
  }

  return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
}
