import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pdf } from '@react-pdf/renderer';
import EstimatePDF from '@/components/EstimatePDF';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const estimate = await prisma.estimate.findUnique({
      where: { signatureToken: token },
      include: {
        customer: true,
        items: {
          select: { productId: true, name: true, price: true },
        },
      },
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

    const estimatePdf = pdf(
      EstimatePDF({
        customer: estimate.customer as any,
        items: estimate.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          totalPrice: item.price,
        })),
        totalPrice: estimate.totalPrice,
        signatureDataUrl: undefined,
        estimateId: estimate.id,
        date: today,
        quoteType: estimate.quoteType as any,
        exteriorSqft: estimate.exteriorSqft || undefined,
        approvedDiscount: estimate.approvedDiscount || 0,
      })
    );

    const pdfBlob = await estimatePdf.toBlob();
    const arrayBuffer = await pdfBlob.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="estimate.pdf"',
      },
    });
  } catch (error) {
    console.error('GET /api/sign/[token]/estimate-pdf error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
