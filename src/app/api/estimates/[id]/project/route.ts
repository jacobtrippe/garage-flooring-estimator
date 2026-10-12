import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from "@/lib/requireAuth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};

    if (body.downPaymentReceived === true) {
      updateData.downPaymentReceived = true;
      updateData.downPaymentReceivedAt = new Date();
    } else if (body.downPaymentReceived === false) {
      updateData.downPaymentReceived = false;
      updateData.downPaymentReceivedAt = null;
    }

    if (body.projectCompleted === true) {
      updateData.projectCompleted = true;
      updateData.projectCompletedAt = new Date();
    } else if (body.projectCompleted === false) {
      updateData.projectCompleted = false;
      updateData.projectCompletedAt = null;
    }

    const stringFields = ['flakeType', 'colorChosen', 'topCoatType', 'sealerType', 'storageNotes'] as const;
    for (const field of stringFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    const boolFields = ['storageRequired', 'materialsPurchased', 'finalPaymentCollected'] as const;
    for (const field of boolFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    const estimate = await prisma.estimate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(estimate);
  } catch (error) {
    console.error('PUT /api/estimates/[id]/project error:', error);
    return NextResponse.json({ error: 'Failed to update project details' }, { status: 500 });
  }
}
