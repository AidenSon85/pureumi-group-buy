import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const { name, sortOrder } = await req.json();
  const category = await prisma.category.create({ data: { name, sortOrder: sortOrder || 0 } });
  return NextResponse.json(category, { status: 201 });
}
