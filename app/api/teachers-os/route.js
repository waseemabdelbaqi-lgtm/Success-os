import { NextResponse } from 'next/server';
import { generateText } from '@/app/lib/ai/orchestrator';
import {
  approveTeacher,
  createBooking,
  decideAbsence,
  getOffer,
  getTeacherPreview,
  getTeachersOsSnapshot,
  listOffers,
  listPlatformAiExtractions,
  listTeachers,
  reportAbsence,
  savePlatformAiExtraction,
  upsertOffer,
  upsertTeacherProfile,
} from '@/app/lib/teachers/teachers-os-store';

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

function isPlatformActor(actorRole = '') {
  const role = String(actorRole || '').toLowerCase();
  return [
    'platform',
    'platform_ai',
    'super_admin',
    'owner',
    'admin',
    'supervisor',
    'employees_os',
  ].includes(role);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId') || '';
    const offerId = searchParams.get('offerId') || '';
    const view = searchParams.get('view') || '';

    if (view === 'preview' && teacherId) {
      const preview = getTeacherPreview(teacherId);
      if (!preview) return fail(new Error('TEACHER_NOT_FOUND'), 404);
      return ok({ preview });
    }

    if (view === 'offer' && offerId) {
      const offer = getOffer(offerId);
      if (!offer) return fail(new Error('OFFER_NOT_FOUND'), 404);
      return ok({ offer });
    }

    if (view === 'marketplace') {
      return ok({
        offers: listOffers({ publishedOnly: true }),
        teachers: listTeachers().filter((t) => t.status === 'approved'),
      });
    }

    if (view === 'platform-ai') {
      const actorRole = searchParams.get('actorRole') || '';
      if (!isPlatformActor(actorRole)) {
        return fail(new Error('PLATFORM_ONLY_FEATURE'), 403);
      }
      return ok({
        extractions: listPlatformAiExtractions(
          teacherId ? { teacherId } : undefined,
        ),
      });
    }

    const actorRole = searchParams.get('actorRole') || '';
    const includePlatformAi = isPlatformActor(actorRole);
    const snapshot = getTeachersOsSnapshot(teacherId || undefined, {
      includePlatformAi,
    });
    // Spread for TeachersOsWorkspace compatibility (expects teacher/offers at root).
    return ok({ snapshot, ...snapshot });
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const action = String(body?.action || '');

    if (action === 'upsertTeacher' || action === 'registerTeacher') {
      const teacher = upsertTeacherProfile({
        ...(body.teacher || body || {}),
        registeredBy: body.registeredBy || body.teacher?.registeredBy || 'self',
        registeredByActor:
          body.registeredByActor || body.actor || body.teacher?.registeredByActor || '',
      });
      return ok({ teacher });
    }

    if (action === 'supervisorRegisterTeacher') {
      const teacher = upsertTeacherProfile({
        ...(body.teacher || {}),
        registeredBy: 'supervisor',
        registeredByActor: body.actor || body.registeredByActor || 'supervisor',
        status: 'approved',
      });
      return ok({ teacher, registeredBy: 'supervisor' });
    }

    if (action === 'approveTeacher') {
      const teacher = approveTeacher(body.teacherId, body.actor || 'super_admin');
      return ok({ teacher });
    }

    if (action === 'upsertOffer') {
      const offer = upsertOffer(body.offer || {});
      return ok({ offer });
    }

    if (action === 'createBooking') {
      const booking = createBooking(body.booking || body.payload || body);
      return ok({ booking });
    }

    if (action === 'reportAbsence') {
      const absence = reportAbsence(body.absence || body.payload || body);
      return ok({ absence });
    }

    if (action === 'decideAbsence') {
      const absence = decideAbsence(body.decision || body.payload || body);
      return ok({ absence });
    }

    /**
     * Platform-only: AI may register/extract information from teacher videos.
     * Never exposed on student/teacher public surfaces.
     */
    if (action === 'platformExtractFromVideo') {
      const actorRole = body.actorRole || body.actor || '';
      if (!isPlatformActor(actorRole)) {
        return fail(new Error('PLATFORM_ONLY_FEATURE'), 403);
      }

      const teacherId = String(body.teacherId || '');
      const sourceName = String(body.sourceName || body.videoName || 'intro-video');
      const curriculum = String(body.curriculum || '');
      const subject = String(body.subject || '');
      const aboutHint = String(body.aboutHint || body.transcriptHint || '');

      let summary = '';
      let extracted = {
        topics: [],
        strengths: [],
        teachingStyle: '',
        suggestedOfferTitles: [],
      };

      try {
        const prompt = [
          'استخلص معلومات تعليمية من فيديو تعريفي لمعلم على منصة Success OS.',
          'أعد JSON فقط بالمفاتيح: summary, topics, strengths, teachingStyle, suggestedOfferTitles',
          `اسم المصدر: ${sourceName}`,
          curriculum ? `المنهج: ${curriculum}` : '',
          subject ? `المادة: ${subject}` : '',
          aboutHint ? `نص مساعد من المعلم: ${aboutHint}` : '',
          'اللغة: العربية. لا تذكر بيانات هوية أو وثائق.',
        ]
          .filter(Boolean)
          .join('\n');

        const ai = await generateText({
          prompt,
          system:
            'أنت محرك ذكاء اصطناعي داخلي لمنصة Success OS فقط. استخلاص المعلومات ملك للمنصة وليس للمعلم أو الطالب.',
          temperature: 0.3,
          maxTokens: 700,
        });

        const raw = String(ai?.text || '').trim();
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          summary = String(parsed.summary || '');
          extracted = {
            topics: Array.isArray(parsed.topics) ? parsed.topics.map(String) : [],
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
            teachingStyle: String(parsed.teachingStyle || ''),
            suggestedOfferTitles: Array.isArray(parsed.suggestedOfferTitles)
              ? parsed.suggestedOfferTitles.map(String)
              : [],
          };
        } else {
          summary = raw.slice(0, 1200);
        }
      } catch {
        summary =
          aboutHint ||
          `استخلاص منصة داخلي من الفيديو (${sourceName}) — جاهز لأرشيف Success OS.`;
        extracted = {
          topics: [subject, curriculum].filter(Boolean),
          strengths: ['تقديم تعريفي واضح', 'جاهزية للحصص المسجلة'],
          teachingStyle: 'أسلوب تعليمي تفاعلي',
          suggestedOfferTitles: subject
            ? [`حصة مسجلة — ${subject}`, `شرح منهج ${curriculum || subject}`]
            : ['حصة مسجلة — مقدمة'],
        };
      }

      const row = savePlatformAiExtraction({
        platformOnly: true,
        teacherId,
        sourceType: 'video',
        sourceName,
        curriculum,
        subject,
        summary,
        extracted,
        actor: String(actorRole || 'platform_ai'),
      });

      return ok({ extraction: row, platformOnly: true });
    }

    return fail(new Error('UNKNOWN_ACTION'), 400);
  } catch (error) {
    return fail(error, 400);
  }
}
