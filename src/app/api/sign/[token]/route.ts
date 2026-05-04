import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { signatureDataUrl } = body;

    if (!signatureDataUrl) {
      return NextResponse.json({ error: 'Signature data required' }, { status: 400 });
    }

    const estimate = await prisma.estimate.findUnique({
      where: { signatureToken: token },
      include: { customer: true },
    });

    if (!estimate) {
      return NextResponse.json({ error: 'Signing link not found' }, { status: 404 });
    }

    if (estimate.signatureTokenExpiresAt && new Date(estimate.signatureTokenExpiresAt) < new Date()) {
      return NextResponse.json({ error: 'Signing link has expired' }, { status: 410 });
    }

    if (estimate.customerSignedAt) {
      return NextResponse.json({ error: 'Agreement already signed' }, { status: 400 });
    }

    await prisma.estimate.update({
      where: { id: estimate.id },
      data: {
        signatureDataUrl,
        customerSignedAt: new Date(),
      },
    });

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
    const ownerPhone = process.env.PLATINUM_OWNER_PHONE;

    if (accountSid && authToken && twilioNumber && ownerPhone) {
      const smsBody = `Customer ${estimate.customer.name} signed the agreement for estimate $${estimate.totalPrice.toFixed(2)}. Ready for contractor signature.`;

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: twilioNumber,
          To: `+1${ownerPhone}`,
          Body: smsBody,
        }).toString(),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/sign/[token] error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to save signature', details: errorMessage },
      { status: 500 }
    );
  }
}
