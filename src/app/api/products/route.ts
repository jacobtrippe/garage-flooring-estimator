import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const sectionId = req.nextUrl.searchParams.get("sectionId");

  const products = await prisma.product.findMany({
    where: sectionId ? { sectionId } : undefined,
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const maxOrder = await prisma.product.findFirst({
    where: { sectionId: data.sectionId },
    orderBy: { displayOrder: "desc" },
    select: { displayOrder: true },
  });
  const product = await prisma.product.create({
    data: {
      ...data,
      price: parseFloat(data.price),
      displayOrder: (maxOrder?.displayOrder || 0) + 1,
    },
  });
  return NextResponse.json(product, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { id, ...data } = await req.json();
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      price: parseFloat(data.price),
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
