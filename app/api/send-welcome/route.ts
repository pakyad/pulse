import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

const WELCOME_HTML = (name: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.04)">
  <tr><td style="padding:48px 40px 0 40px;text-align:center">
    <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:16px 0 8px 0">Hey ${name},</h1>
    <p style="font-size:14px;color:#64748b;line-height:1.6;margin:0 0 32px 0">
      You're officially part of <strong style="color:#0f172a">Pulse</strong> — MIIT's campus marketplace.<br>
      Buy, sell, and earn across UniKL with escrow protection.
    </p>
  </td></tr>
  <tr><td style="padding:0 40px">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="33%" style="text-align:center;padding:16px 8px;background:#f8fafc;border-radius:16px">
          <span style="font-size:11px;font-weight:600;color:#0f172a;display:block;margin-top:4px">Browse Listings</span>
        </td>
        <td width="33%" style="text-align:center;padding:16px 8px;background:#f8fafc;border-radius:16px">
          <span style="font-size:11px;font-weight:600;color:#0f172a;display:block;margin-top:4px">Escrow Chat</span>
        </td>
        <td width="33%" style="text-align:center;padding:16px 8px;background:#f8fafc;border-radius:16px">
          <span style="font-size:11px;font-weight:600;color:#0f172a;display:block;margin-top:4px">Earn as Runner</span>
        </td>
      </tr>
    </table>
  </td></tr>
  <tr><td style="padding:32px 40px 0 40px;text-align:center">
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/home"
       style="display:inline-block;padding:14px 40px;background:#0f172a;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:40px">
      Start Exploring ->
    </a>
  </td></tr>
  <tr><td style="padding:32px 40px 48px 40px;text-align:center">
    <p style="font-size:11px;color:#94a3b8;margin:0;line-height:1.6">
      Pulse · UniKL MIIT · Kuala Lumpur<br>
      <span style="color:#cbd5e1">Need help? Reply to this email</span>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body>
</html>`;

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();
    if (!email || !name) {
      return NextResponse.json({ error: 'Missing email or name' }, { status: 400 });
    }

    await resend.emails.send({
      from: 'Pulse <welcome@pulse.edu>',
      to: email,
      subject: 'Welcome to Pulse, ' + name.split(' ')[0] + '! Your campus hub is live',
      html: WELCOME_HTML(name),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Send Welcome]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
