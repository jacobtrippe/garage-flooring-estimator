import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Storage service not configured. Please set SUPABASE environment variables.' },
        { status: 500 }
      );
    }

    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const estimate = await prisma.estimate.findUnique({ where: { id } });
    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    const buffer = await file.arrayBuffer();
    // Unique filename per upload — no collisions across multiple photos
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const fileName = `Photo-${uniqueSuffix}.jpg`;
    const filePath = `${estimate.customerId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('estimates')
      .upload(filePath, buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('estimates')
      .getPublicUrl(filePath);

    const url = publicUrlData?.publicUrl;

    const photo = await prisma.estimatePhoto.create({
      data: { estimateId: id, url },
    });

    return NextResponse.json({ success: true, photo: { id: photo.id, url: photo.url } });
  } catch (error) {
    console.error('Upload photo error:', error);
    return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 });
  }
}
