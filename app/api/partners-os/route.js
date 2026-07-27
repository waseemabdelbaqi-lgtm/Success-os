import { NextResponse } from 'next/server';
import {
  getPartnersOsSnapshot,
  getPublicPartnerCard,
  listPartners,
  matchPartners,
  publishPartner,
  requiredFieldsForType,
  seedDemoPartnersIfEmpty,
  upsertPartnerProfile,
  whatAudienceSees,
  whatPartnerSees,
} from '@/app/lib/partners/partners-os-store';

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

export async function GET(request) {
  try {
    seedDemoPartnersIfEmpty();
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || '';
    const partnerId = searchParams.get('partnerId') || '';

    if (view === 'schema') {
      const type = searchParams.get('type') || 'university';
      return ok({
        type,
        requiredFields: requiredFieldsForType(type),
        whatPartnerSees: whatPartnerSees(),
        whatAudienceSees: whatAudienceSees(type),
      });
    }

    if (view === 'preview' && partnerId) {
      const partner = getPublicPartnerCard(partnerId);
      if (!partner) return fail(new Error('PARTNER_NOT_FOUND'), 404);
      return ok({ partner });
    }

    if (view === 'discover' || view === 'match') {
      const matches = matchPartners({
        audience: searchParams.get('audience') || 'student',
        query: searchParams.get('query') || '',
        country: searchParams.get('country') || '',
        type: searchParams.get('type') || '',
        need: searchParams.get('need') || '',
      });
      return ok({ matches });
    }

    if (view === 'marketplace') {
      return ok({
        partners: listPartners({ publishedOnly: true }).map((p) =>
          getPublicPartnerCard(p.id),
        ),
      });
    }

    const snapshot = getPartnersOsSnapshot(partnerId || undefined);
    return ok({ snapshot, ...snapshot });
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const action = String(body?.action || '');

    if (action === 'upsertPartner' || action === 'registerPartner') {
      const partner = upsertPartnerProfile(body.partner || body);
      return ok({ partner });
    }

    if (action === 'publishPartner') {
      const partner = publishPartner(
        body.partnerId,
        body.actor || body.partner?.email || 'partner',
      );
      return ok({ partner });
    }

    if (action === 'match') {
      const matches = matchPartners(body.match || body);
      return ok({ matches });
    }

    return fail(new Error('UNKNOWN_ACTION'), 400);
  } catch (error) {
    return fail(error, 400);
  }
}
