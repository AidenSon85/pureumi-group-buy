import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const factoryId = searchParams.get("factoryId");
  const manage = searchParams.get("manage") === "1";

  if (manage) {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (role !== "ADMIN" && role !== "MANAGER") {
      return NextResponse.json({ error: "권한 없음" }, { status: 403 });
    }
    const banners = await prisma.banner.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(banners);
  }

  const now = new Date();
  const where: any = {
    isActive: true,
    OR: [{ startDate: null }, { startDate: { lte: now } }],
    AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
  };
  if (factoryId) {
    where.factoryIds_OR = [
      { factoryIds: { has: factoryId } },
      { factoryIds: { equals: [] } },
    ];
  }

  const banners = await prisma.banner.findMany({
    where: factoryId
      ? {
          isActive: true,
          OR: [{ startDate: null }, { startDate: { lte: now } }],
          AND: [
            { OR: [{ endDate: null }, { endDate: { gte: now } }] },
            { OR: [{ factoryIds: { has: factoryId } }, { factoryIds: { equals: [] } }] },
          ],
        }
      : {
          isActive: true,
          OR: [{ startDate: null }, { startDate: { lte: now } }],
          AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
        },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(banners);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  const body = await req.json();
  const { imageUrl, linkUrl, title, content, factoryIds, sortOrder, startDate, endDate } = body;
  if (!imageUrl) return NextResponse.json({ error: "이미지 필수" }, { status: 400 });

  const banner = await prisma.banner.create({
    data: {
      imageUrl,
      linkUrl: linkUrl || null,
      title: title || null,
      content: content || null,
      factoryIds: factoryIds || [],
      sortOrder: sortOrder ?? 0,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });
  return NextResponse.json(banner);
}
