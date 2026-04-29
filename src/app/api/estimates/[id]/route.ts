import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const estimate = await prisma.estimate.findUnique({
      where: { id },
      include: {
        items: {
          select: { id: true, productId: true, name: true, price: true },
        },
      },
    });

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    return NextResponse.json(estimate);
  } catch (error) {
    console.error('GET /api/estimates/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch estimate' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { items, totalPrice, status, signatureDataUrl, contractorSignatureDataUrl, installationDate, quoteType, exteriorSqft, approvedDiscount } = body;

    const updateData: any = {};

    if (totalPrice !== undefined) updateData.totalPrice = totalPrice;
    if (status !== undefined) updateData.status = status;
    if (signatureDataUrl !== undefined) updateData.signatureDataUrl = signatureDataUrl;
    if (contractorSignatureDataUrl !== undefined) updateData.contractorSignatureDataUrl = contractorSignatureDataUrl;
    if (installationDate !== undefined) updateData.installationDate = installationDate;
    if (quoteType !== undefined) updateData.quoteType = quoteType;
    if (exteriorSqft !== undefined) updateData.exteriorSqft = exteriorSqft;
    if (approvedDiscount !== undefined) updateData.approvedDiscount = approvedDiscount;

    if (items && Array.isArray(items)) {
      updateData.items = {
        deleteMany: {},
        createMany: {
          data: items.map((item: { productId: string; name: string; price: number }) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
          })),
        },
      };
    }

    const estimate = await prisma.estimate.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          select: { id: true, productId: true, name: true, price: true },
        },
      },
    });

    return NextResponse.json(estimate);
  } catch (error) {
    console.error('PUT /api/estimates/[id] error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      return NextResponse.json({ error: `Failed to update estimate: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to update estimate' }, { status: 500 });
  }
}
