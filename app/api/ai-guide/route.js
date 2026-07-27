import { NextResponse } from 'next/server';
import { generateText } from '@/app/lib/ai/orchestrator';
import {
  PARTNERSHIP_PROTOCOL,
  buildGuideNarrative,
  getCompanionSnapshot,
  getOrCreateSession,
  listEvents,
  recordEvent,
  runSurfaceVerification,
  upsertMilestone,
} from '@/app/lib/ai/companion-guide-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ok(data, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

function fail(error, status = 400) {
  return NextResponse.json(
    { ok: false, error: error?.message || String(error || 'REQUEST_FAILED') },
    { status },
  );
}

function requestOrigin(request) {
  try {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  } catch {
    return 'http://127.0.0.1:3055';
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'snapshot';
    const sessionId = searchParams.get('sessionId') || '';

    if (view === 'protocol') {
      return ok({ protocol: PARTNERSHIP_PROTOCOL });
    }

    if (view === 'events') {
      const session = getOrCreateSession({ sessionId });
      return ok({
        session,
        events: listEvents({ sessionId: session.id, limit: 120 }),
      });
    }

    const snapshot = getCompanionSnapshot(sessionId || undefined);
    return ok({ snapshot });
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const action = String(body?.action || '');

    if (action === 'ensureSession') {
      const session = getOrCreateSession({
        sessionId: body.sessionId,
        actor: body.actor,
        role: body.role,
        label: body.label,
      });
      return ok({ session });
    }

    if (action === 'record' || action === 'log') {
      const result = recordEvent({
        sessionId: body.sessionId,
        actor: body.actor,
        role: body.role,
        type: body.type || 'page_view',
        path: body.path,
        title: body.title,
        detail: body.detail,
        meta: body.meta,
        source: body.source || 'beacon',
      });
      return ok(result);
    }

    if (action === 'milestone') {
      const milestone = upsertMilestone(body.milestone || body);
      recordEvent({
        sessionId: body.sessionId,
        actor: body.actor || 'partner',
        type: 'milestone',
        path: milestone.path,
        title: milestone.title,
        detail: milestone.note,
        source: 'manual',
      });
      return ok({ milestone });
    }

    if (action === 'verify') {
      const origin = body.origin || requestOrigin(request);
      const report = await runSurfaceVerification({
        origin,
        actor: body.actor || 'companion_ai',
        sessionId: body.sessionId,
      });
      return ok({ report, narrative: buildGuideNarrative({ sessionId: body.sessionId }) });
    }

    if (action === 'narrate') {
      const snapshot = getCompanionSnapshot(body.sessionId || undefined);
      let aiText = '';
      try {
        const prompt = [
          'أنت دليل الشريك الحي داخل SUCCESS OS — شريك بناء وليس مجرد أداة.',
          'اكتب بالعربية فقرة قصيرة (4-6 جمل) تلخّص أين وصلنا وما الخطوة التالية باحتراف.',
          'لا تخترع ميزات غير موجودة. اعتمد على السجل التالي:',
          snapshot.narrative,
          `معالم: ${snapshot.milestones.map((m) => m.title).join(' | ')}`,
          snapshot.verification
            ? `تحقق أخير: ${snapshot.verification.score}%`
            : 'لا تحقق بعد',
          body.question ? `سؤال الشريك: ${body.question}` : '',
        ]
          .filter(Boolean)
          .join('\n');

        const ai = await generateText({
          prompt,
          maxOutputTokens: 500,
          safetyIdentifier: 'success-os-companion-guide',
        });
        aiText = String(ai?.text || '').trim();
      } catch {
        aiText = snapshot.narrative;
      }
      recordEvent({
        sessionId: snapshot.session.id,
        actor: body.actor || 'companion_ai',
        type: 'narrate',
        path: '/guide',
        title: 'سرد حالة البناء',
        detail: aiText.slice(0, 500),
        source: 'companion_ai',
      });
      return ok({ narrative: aiText || snapshot.narrative, fallback: snapshot.narrative });
    }

    return fail(new Error('UNKNOWN_ACTION'), 400);
  } catch (error) {
    return fail(error, 400);
  }
}
