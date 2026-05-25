import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const factoryId = searchParams.get("factoryId") || "";
  const search = searchParams.get("search") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  const where: any = {};
  if (factoryId) where.factoryId = factoryId;
  if (startDate || endDate) {
    where.orderedAt = {};
    if (startDate) where.orderedAt.gte = new Date(startDate);
    if (endDate) where.orderedAt.lte = new Date(endDate + "T23:59:59");
  }
  if (search) {
    where.user = { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] };
  }

  const orders = await prisma.order.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true } }, factory: { select: { name: true } } },
    orderBy: { orderedAt: "desc" },
  });

  const map: Record<string, any> = {};
  for (const o of orders) {
    if (!map[o.userId]) {
      map[o.userId] = {
        userId: o.userId, userName: o.user.name, userEmail: o.user.email,
        factoryName: o.factory.name, orderCount: 0, totalAmount: 0, lastOrderAt: o.orderedAt,
      };
    }
    map[o.userId].orderCount++;
    map[o.userId].totalAmount += o.totalAmount;
  }

  const result = Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  return NextResponse.json(result);
}
