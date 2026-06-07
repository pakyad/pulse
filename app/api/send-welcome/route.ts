import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

function getWelcomeHtml(name: string): string {
  return '<html><body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif">'
    + '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 0">'
    + '<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px">'
    + '<tr><td style="padding:48px 40px;text-align:center">'
    + '<h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px 0">Hey ' + name + ',</h1>'
    + '<p style="font-size:14px;color:#64748b;line-height:1.6;margin:0 0 32px 0">'
    + 'You are officially part of <strong style="color:#0f172a">Pulse</strong> - MIIT campus marketplace.<br>'
    + 'Buy, sell, and earn across UniKL with escrow protection.</p>'
    + '<a href="' + (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/home"'
    + ' style="display:inline-block;padding:14px 40px;background:#0f172a;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:40px">'
    + 'Start Exploring</a>'
    + '</td></tr></table></td></tr></table></body></html>';
}

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();
    if (!email || !name) {
      return NextResponse.json({ error: 'Missing email or name' }, { status: 400 });
    }
    await resend.emails.send({
      from: 'Pulse <welcome@pulse.edu>',
      to: email,
      subject: 'Welcome to Pulse! Your campus hub is live',
      html: getWelcomeHtml(name),
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Send Welcome]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
