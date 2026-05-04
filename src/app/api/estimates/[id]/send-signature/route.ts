import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    return NextResponse.json({ success: true, signingUrl });
  } catch (error) {
    console.error('POST /api/estimates/[id]/send-signature error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to send signing link', details: errorMessage },
      { status: 500 }
    );
  }
}
