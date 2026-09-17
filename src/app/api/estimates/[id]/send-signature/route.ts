import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function generateToken(customerName: string): string {
  const slug = slugify(customerName);
  const random = Math.random().toString(36).substring(2, 12);
  return `${slug}-${random}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { customerEmail, customerName, installationDate } = body;

    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer email required' }, { status: 400 });
    }

    const estimate = await prisma.estimate.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    const token = generateToken(estimate.customer.name);
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    await prisma.estimate.update({
      where: { id },
      data: {
        signatureToken: token,
        signatureTokenExpiresAt: expiresAt,
      },
    });

    const signingUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/sign/${token}`;

    const firstName = estimate.customer.name.split(' ')[0];
    let emailSent = false;

    if (resend) {
      const { error: emailError } = await resend.emails.send({
        from: 'Platinum Installs <noreply@platinuminstallstx.com>',
        replyTo: 'jtplatinstalls@gmail.com',
        to: estimate.customer.email,
        subject: 'Your Estimate is Ready — Please Review & Sign',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
          <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
              <tr><td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

                  <!-- Header -->
                  <tr>
                    <td style="background:#1e2d40;padding:28px 32px;">
                      <p style="margin:0;color:#c9a84c;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Platinum Installs</p>
                      <p style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:700;">Your estimate is ready</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:32px;">
                      <p style="margin:0 0 16px;color:#333;font-size:16px;">Hi ${firstName},</p>
                      <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">
                        Your estimate from Platinum Installs is ready for your review. Please click the button below to view the details and sign from any device — it only takes a minute.
                      </p>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding:8px 0 28px;">
                            <a href="${signingUrl}" style="display:inline-block;background:#1e2d40;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:6px;">
                              Review &amp; Sign
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:0 0 8px;color:#888;font-size:13px;">Or copy this link into your browser:</p>
                      <p style="margin:0 0 24px;word-break:break-all;">
                        <a href="${signingUrl}" style="color:#1e5fa8;font-size:13px;">${signingUrl}</a>
                      </p>

                      <p style="margin:0;color:#aaa;font-size:12px;">This link expires in 14 days. Questions? Reply to this email or call us directly.</p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#f9f9f9;border-top:1px solid #eee;padding:20px 32px;">
                      <p style="margin:0;color:#aaa;font-size:12px;">Platinum Installs — Residential Concrete Coatings</p>
                    </td>
                  </tr>

                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `,
      });

      if (emailError) {
        console.error('Signing link email error:', emailError);
      } else {
        emailSent = true;
      }
    }

    return NextResponse.json({ success: true, signingUrl, emailSent });
  } catch (error) {
    console.error('POST /api/estimates/[id]/send-signature error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to send signing link', details: errorMessage },
      { status: 500 }
    );
  }
}
