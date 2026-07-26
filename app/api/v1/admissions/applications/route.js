import { NextResponse } from 'next/server';
import {
  buildOfficialApplicationHtml,
  toFunnelInstitution,
} from '@/app/data/admission-funnel';
import {
  getPayment,
  listApplicationsByInstitution,
  pushNotifications,
  saveApplication,
} from '@/app/lib/admissions/funnel-store';
import { globalInstitutions } from '@/app/data/university-registry';
import {
  institutionKind,
  kindLabelAr,
  notificationRoleForKind,
  officialContactEmail,
} from '@/app/data/university-inquiry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Dual-route application submission.
 * Requires a paid paymentId for the institution.
 *
 * Route A — is_partner: persist application + in-app notifications
 * Route B — !is_partner: compose + send (or queue) official HTML email
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const institutionId = String(body.institutionId || '');
    const paymentId = String(body.paymentId || '');
    const institution = globalInstitutions.find((u) => u.id === institutionId);

    if (!institution) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INSTITUTION_NOT_FOUND', message: 'Institution not found' },
        },
        { status: 404 },
      );
    }

    const payment = paymentId ? await getPayment(paymentId) : null;
    if (!payment || payment.status !== 'paid' || payment.institutionId !== institutionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_REQUIRED',
            message: 'Step 3 is locked until the $5 payment callback returns paid=true',
          },
        },
        { status: 402 },
      );
    }

    const funnelInst = toFunnelInstitution(institution, {
      nationality: body.nationality,
      studyCountry: body.studyCountry || institution.country,
    });
    const isPartner = Boolean(funnelInst.is_partner);
    const kind = institutionKind(institution);
    const id = `app_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const application = {
      id,
      institutionId,
      institutionName: institution.name,
      institutionKind: kind,
      is_partner: isPartner,
      paymentId,
      nationality: body.nationality || payment.nationality || '',
      studyCountry: body.studyCountry || institution.country,
      gpa: body.gpa || '',
      targetDegree: body.targetDegree || '',
      major: body.major || '',
      studentName: body.personal?.fullName || body.studentName || '',
      personal: body.personal || {},
      documents: {
        transcript: sanitizeDoc(body.documents?.transcript),
        passport: sanitizeDoc(body.documents?.passport),
      },
      message: body.message || '',
      status: isPartner ? 'submitted_to_partner' : 'submitted_via_email',
      route: isPartner ? 'A_partner_notifications' : 'B_official_email',
      createdAt: new Date().toISOString(),
    };

    await saveApplication(application);

    if (isPartner) {
      const role = notificationRoleForKind(kind);
      const label = kindLabelAr(kind);
      const notes = [
        {
          id: `app-org-${id}`,
          to: role,
          from: 'student',
          title: `New ${label} application — ${application.studentName}`,
          body: `${application.major || '—'} · ${application.targetDegree || '—'} · ${application.nationality || '—'}`,
          read: false,
          institutionId,
          applicationId: id,
          created: application.createdAt,
          channel: 'platform',
          type: 'admission_application',
        },
        {
          id: `app-stu-${id}`,
          to: 'student',
          from: institution.name,
          title: `Application received by ${institution.name}`,
          body: 'Partner institution — track status in Notifications.',
          read: false,
          institutionId,
          applicationId: id,
          created: application.createdAt,
          channel: 'platform',
          type: 'admission_application',
        },
      ];
      await pushNotifications(notes);

      return NextResponse.json({
        success: true,
        data: {
          route: 'A',
          is_partner: true,
          application,
          notifications: notes,
          next: '/notifications',
        },
      });
    }

    // Route B — official email
    const email = buildOfficialApplicationHtml({
      institution,
      application,
      nationality: application.nationality,
    });

    const sendResult = await maybeSendEmail({
      to: email.to || officialContactEmail(institution),
      subject: email.subject,
      html: email.html,
      text: email.text,
      attachments: buildAttachments(application.documents),
    });

    application.email = {
      to: email.to,
      subject: email.subject,
      sent: sendResult.sent,
      provider: sendResult.provider,
      mailto: email.mailto,
    };
    await saveApplication(application);

    return NextResponse.json({
      success: true,
      data: {
        route: 'B',
        is_partner: false,
        application,
        email: {
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
          mailto: email.mailto,
          sent: sendResult.sent,
          provider: sendResult.provider,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SUBMIT_FAILED', message: error?.message || 'Submit failed' },
      },
      { status: 400 },
    );
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const institutionId = searchParams.get('institutionId') || '';
  if (!institutionId) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INSTITUTION_REQUIRED', message: 'institutionId query required' },
      },
      { status: 400 },
    );
  }
  const rows = await listApplicationsByInstitution(institutionId);
  return NextResponse.json({ success: true, data: { applications: rows } });
}

function sanitizeDoc(doc) {
  if (!doc || !doc.name) return null;
  return {
    name: String(doc.name).slice(0, 200),
    type: String(doc.type || 'application/pdf').slice(0, 100),
    size: Number(doc.size) || 0,
    // Cap base64 payload (~1.5MB decoded) to protect memory
    dataBase64:
      typeof doc.dataBase64 === 'string' && doc.dataBase64.length < 2_100_000
        ? doc.dataBase64
        : '',
  };
}

function buildAttachments(documents = {}) {
  const out = [];
  for (const key of ['transcript', 'passport']) {
    const doc = documents[key];
    if (doc?.dataBase64 && doc?.name) {
      out.push({
        filename: doc.name,
        content: doc.dataBase64,
        encoding: 'base64',
        contentType: doc.type || 'application/pdf',
      });
    }
  }
  return out;
}

async function maybeSendEmail({ to, subject, html, text, attachments }) {
  const smtpUrl = process.env.SMTP_URL || process.env.EMAIL_SERVER;
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'SUCCESS OS <admissions@successos.app>',
          to: [to],
          subject,
          html,
          text,
          attachments: (attachments || []).map((a) => ({
            filename: a.filename,
            content: a.content,
          })),
        }),
      });
      if (res.ok) return { sent: true, provider: 'resend' };
    } catch {
      /* fall through */
    }
  }

  if (smtpUrl) {
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport(smtpUrl);
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'SUCCESS OS <admissions@successos.app>',
        to,
        subject,
        html,
        text,
        attachments,
      });
      return { sent: true, provider: 'smtp' };
    } catch {
      /* fall through */
    }
  }

  // Preview mode: email composed and returned to client for mailto / copy
  return { sent: false, provider: 'preview_compose' };
}
