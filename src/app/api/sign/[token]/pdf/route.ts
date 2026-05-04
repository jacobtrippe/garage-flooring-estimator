import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pdf } from '@react-pdf/renderer';
import ServiceAgreementPDF from '@/components/ServiceAgreementPDF';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const estimate = await prisma.estimate.findUnique({
      where: { signatureToken: token },
      include: { customer: true },
    });

    if (!estimate) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (estimate.signatureTokenExpiresAt && new Date(estimate.signatureTokenExpiresAt) < new Date()) {
      return NextResponse.json({ error: 'Expired' }, { status: 410 });
    }

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const agreementPdf = pdf(
      ServiceAgreementPDF({
        customer: estimate.customer as any,
        totalPrice: estimate.totalPrice,
        installationDate: estimate.installationDate || today,
        signatureDataUrl: undefined,
        contractorSignatureDataUrl: undefined,
        date: today,
      })
    );

    const pdfBlob = await agreementPdf.toBlob();
    const arrayBuffer = await pdfBlob.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="agreement.pdf"',
      },
    });
  } catch (error) {
    console.error('GET /api/sign/[token]/pdf error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
