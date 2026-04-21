import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
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
