import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const counts = searchParams.get("counts") === "true";

  const factories = await prisma.factory.findMany({
    orderBy: { name: "asc" },
    include: counts ? { _count: { select: { users: true, products: true, orders: true } } } : undefined,
  });
  return NextResponse.json(factories);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, code, address, phone } = body;
  if (!name || !code) return NextResponse.json({ error: "name, code 필수" }, { status: 400 });

  try {
    const factory = await prisma.factory.create({ data: { name, code: code.toUpperCase(), address, phone } });
    return NextResponse.json(factory, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "이미 존재하는 코드입니다" }, { status: 409 });
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
