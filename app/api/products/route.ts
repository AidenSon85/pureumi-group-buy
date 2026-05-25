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
  if (isActiveStr !== null && isActiveStr !== "") where.isActive = isActiveStr === "true";
  if (factoryId) {
    where.OR = [
      { factoryId },
      { factoryIds: { has: factoryId } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where, skip: page * limit, take: limit,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        factory: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);
  return NextResponse.json({ products, total });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, factoryIds = [], price, groupBuyStartAt, groupBuyEndAt, ...rest } = body;

  const primaryFactoryId = factoryIds[0] || rest.factoryId;
  if (!name || !primaryFactoryId || !price) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  delete rest.factoryId;

  try {
    const product = await prisma.product.create({
      data: {
        name,
        factoryId: primaryFactoryId,
        factoryIds,
        price,
        groupBuyStartAt: groupBuyStartAt ? new Date(groupBuyStartAt) : null,
        groupBuyEndAt: groupBuyEndAt ? new Date(groupBuyEndAt) : null,
        ...rest,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
