import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const customers = await prisma.customer.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      estimates: {
        select: {
          id: true,
          totalPrice: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          pdfUrl: true,
          estimatePdfUrl: true,
          agreementPdfUrl: true,
          customerSignedAt: true,
          contractorSignatureDataUrl: true,
          photos: {
            select: { id: true, url: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const customer = await prisma.customer.create({
    data,
  });
  return NextResponse.json(customer, { status: 201 });
}
