import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page") || 0);
  const limit = Number(searchParams.get("limit") || 20);
  const search = searchParams.get("search") || "";
  const factoryId = searchParams.get("factoryId") || "";
  const isActiveStr = searchParams.get("isActive");

  const where: any = {};
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (factoryId) where.factoryId = factoryId;
  if (isActiveStr !== null && isActiveStr !== "") where.isActive = isActiveStr === "true";

  const [products, total, activeProducts] = await Promise.all([
    prisma.product.findMany({
      where, skip: page * limit, take: limit,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        factory: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.product.count({ where }),
    factoryId ? prisma.product.count({ where: { factoryId, isActive: true } }) : 0,
  ]);
  return NextResponse.json({ products, total, activeProducts });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, factoryId, price, ...rest } = body;
  if (!name || !factoryId || !price) return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  try {
    const product = await prisma.product.create({ data: { name, factoryId, price, ...rest } });
    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
