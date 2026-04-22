import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const estimate = await prisma.estimate.findUnique({
      where: { id },
    });

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    const buffer = await file.arrayBuffer();
    const fileName = `Estimate-${id.slice(-8)}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('estimates')
      .upload(`${estimate.customerId}/${fileName}`, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload PDF' },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from('estimates')
      .getPublicUrl(`${estimate.customerId}/${fileName}`);

    const pdfUrl = publicUrlData?.publicUrl;

    await prisma.estimate.update({
      where: { id },
      data: { pdfUrl },
    });

    return NextResponse.json({
      success: true,
      pdfUrl,
    });
  } catch (error) {
    console.error('Upload PDF error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}
