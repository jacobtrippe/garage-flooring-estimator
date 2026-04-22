import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ error: 'customerId required' }, { status: 400 });
    }

    const estimates = await prisma.estimate.findMany({
      where: { customerId },
      include: {
        items: {
          select: { id: true, productId: true, name: true, price: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(estimates);
  } catch (error) {
    console.error('GET /api/estimates error:', error);
    return NextResponse.json({ error: 'Failed to fetch estimates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, items, totalPrice, status = 'draft' } = body;

    if (!customerId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'customerId and items required' },
        { status: 400 }
      );
    }

    const estimate = await prisma.estimate.create({
      data: {
        customerId,
        totalPrice,
        status,
        items: {
          createMany: {
            data: items.map((item: { productId: string; name: string; price: number }) => ({
              productId: item.productId,
              name: item.name,
              price: item.price,
            })),
          },
        },
      },
      include: {
        items: {
          select: { id: true, productId: true, name: true, price: true },
        },
      },
    });

    return NextResponse.json(estimate, { status: 201 });
  } catch (error) {
    console.error('POST /api/estimates error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create estimate', details: errorMessage },
      { status: 500 }
    );
  }
}
