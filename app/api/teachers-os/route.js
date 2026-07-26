import { NextResponse } from 'next/server';
import {
  approveTeacher,
  createBooking,
  decideAbsence,
  getOffer,
  getTeachersOsSnapshot,
  listOffers,
  reportAbsence,
  upsertOffer,
  upsertTeacherProfile,
} from '../../lib/teachers/teachers-os-store.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'snapshot';
    const teacherId = searchParams.get('teacherId') || '';
    const offerId = searchParams.get('offerId') || '';

    if (view === 'offer' && offerId) {
      const offer = getOffer(offerId);
      if (!offer) return json({ ok: false, error: 'OFFER_NOT_FOUND' }, 404);
      return json({ ok: true, offer, published: listOffers({ publishedOnly: true }) });
    }

    if (view === 'marketplace') {
      return json({
        ok: true,
        offers: listOffers({ publishedOnly: true }),
        platformPercent: getTeachersOsSnapshot().platformPercent,
      });
    }

    return json({ ok: true, ...getTeachersOsSnapshot(teacherId) });
  } catch (error) {
    return json({ ok: false, error: error.message || 'GET_FAILED' }, 500);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const action = String(body.action || '');

    if (action === 'registerTeacher' || action === 'updateProfile') {
      const teacher = upsertTeacherProfile(body.payload || body);
      return json({ ok: true, teacher });
    }

    if (action === 'approveTeacher') {
      const teacher = approveTeacher(body.teacherId, body.actor || 'super_admin');
      return json({ ok: true, teacher });
    }

    if (action === 'upsertOffer') {
      const offer = upsertOffer(body.payload || body);
      return json({ ok: true, offer });
    }

    if (action === 'publishOffer') {
      const offer = upsertOffer({ ...(body.payload || body), status: 'published' });
      return json({ ok: true, offer });
    }

    if (action === 'createBooking') {
      const booking = createBooking(body.payload || body);
      return json({ ok: true, booking });
    }

    if (action === 'reportAbsence') {
      const absence = reportAbsence(body.payload || body);
      return json({ ok: true, absence });
    }

    if (action === 'decideAbsence') {
      const absence = decideAbsence(body.payload || body);
      return json({ ok: true, absence });
    }

    return json({ ok: false, error: 'UNKNOWN_ACTION' }, 400);
  } catch (error) {
    return json({ ok: false, error: error.message || 'POST_FAILED' }, 400);
  }
}
