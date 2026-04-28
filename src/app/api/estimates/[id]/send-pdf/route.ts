import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const estimate = await prisma.estimate.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    if (!estimate.customer) {
      return NextResponse.json({ error: 'No customer found' }, { status: 400 });
    }

    if (!estimate.pdfUrl) {
      return NextResponse.json({ error: 'PDF not ready' }, { status: 400 });
    }

    const buttonText = estimate.signatureDataUrl ? 'Download Signed Estimate' : 'Download Estimate';

    const { error: emailError } = await resend.emails.send({
      from: 'Platinum Installs <noreply@platinuminstallstx.com>',
      to: estimate.customer.email,
      subject: `Your Estimate #${estimate.id.slice(-8).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${estimate.customer.name},</h2>
          <p>Your estimate is ready!</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">Total Amount</p>
            <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #2f2f30;">$${estimate.totalPrice.toFixed(2)}</p>
          </div>
          <p>
            <a href="${estimate.pdfUrl}" style="display: inline-block; background-color: #2f2f30; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              ${buttonText}
            </a>
          </p>
          <p style="margin-top: 30px; font-size: 14px; color: #666;">Thank you for choosing Platinum Installs!</p>
        </div>
      `,
    });

    if (emailError) {
      console.error('Email send error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email', details: emailError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
