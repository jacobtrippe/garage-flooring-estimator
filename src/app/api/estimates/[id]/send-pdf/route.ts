import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

    if (!estimate.estimatePdfUrl && !estimate.agreementPdfUrl && !estimate.pdfUrl) {
      return NextResponse.json({ error: 'PDF not ready' }, { status: 400 });
    }

    if (!resend) {
      return NextResponse.json(
        { error: 'Email service not configured. Please set RESEND_API_KEY.' },
        { status: 500 }
      );
    }

    // Fetch both PDFs if available
    const attachments: Array<{ filename: string; content: Buffer }> = [];

    if (estimate.estimatePdfUrl) {
      try {
        const estimateRes = await fetch(estimate.estimatePdfUrl);
        if (estimateRes.ok) {
          const estimateBuffer = await estimateRes.arrayBuffer();
          attachments.push({
            filename: `Estimate-${estimate.id.slice(-8)}.pdf`,
            content: Buffer.from(estimateBuffer),
          });
        }
      } catch (err) {
        console.error('Failed to fetch estimate PDF:', err);
      }
    }

    if (estimate.agreementPdfUrl) {
      try {
        const agreementRes = await fetch(estimate.agreementPdfUrl);
        if (agreementRes.ok) {
          const agreementBuffer = await agreementRes.arrayBuffer();
          attachments.push({
            filename: `ServiceAgreement-${estimate.id.slice(-8)}.pdf`,
            content: Buffer.from(agreementBuffer),
          });
        }
      } catch (err) {
        console.error('Failed to fetch agreement PDF:', err);
      }
    }

    // Fallback to old pdfUrl if new fields aren't set
    if (attachments.length === 0 && estimate.pdfUrl) {
      try {
        const fallbackRes = await fetch(estimate.pdfUrl);
        if (fallbackRes.ok) {
          const fallbackBuffer = await fallbackRes.arrayBuffer();
          attachments.push({
            filename: `Estimate-${estimate.id.slice(-8)}.pdf`,
            content: Buffer.from(fallbackBuffer),
          });
        }
      } catch (err) {
        console.error('Failed to fetch fallback PDF:', err);
      }
    }

    if (attachments.length === 0) {
      return NextResponse.json({ error: 'No PDFs available to send' }, { status: 400 });
    }

    const { error: emailError } = await resend.emails.send({
      from: 'Platinum Installs <noreply@platinuminstallstx.com>',
      to: estimate.customer.email,
      subject: `Your Estimate & Service Agreement #${estimate.id.slice(-8).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${estimate.customer.name},</h2>
          <p>Your estimate and service agreement are ready! Both documents are attached to this email.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">Total Amount</p>
            <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #2f2f30;">$${estimate.totalPrice.toFixed(2)}</p>
          </div>
          <div style="margin: 20px 0; padding: 15px; background-color: #e8f4f8; border-left: 4px solid #0066cc; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #003366; font-weight: bold;">Documents included:</p>
            <ul style="margin: 8px 0 0 20px; color: #003366; font-size: 14px;">
              <li>Estimate</li>
              <li>Service Agreement</li>
            </ul>
          </div>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">Please review both documents and contact us if you have any questions.</p>
          <p style="margin-top: 30px; font-size: 14px; color: #666;">Thank you for choosing Platinum Installs!</p>
        </div>
      `,
      attachments: attachments,
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
