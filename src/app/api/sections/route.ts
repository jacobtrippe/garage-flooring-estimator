import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const sections = await prisma.section.findMany({
    include: { products: { orderBy: { displayOrder: "asc" } } },
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json(sections);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const maxOrder = await prisma.section.findFirst({
    orderBy: { displayOrder: "desc" },
    select: { displayOrder: true },
  });
  const section = await prisma.section.create({
    data: {
      ...data,
      displayOrder: (maxOrder?.displayOrder || 0) + 1,
    },
  });
  return NextResponse.json(section, { status: 201 });
}
