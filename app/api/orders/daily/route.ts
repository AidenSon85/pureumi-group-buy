import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const factoryId = searchParams.get("factoryId") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  const where: any = {};
  if (factoryId) where.factoryId = factoryId;
  if (startDate) where.orderedAt = { gte: new Date(startDate) };
  if (endDate) where.orderedAt = { ...where.orderedAt, lte: new Date(endDate + "T23:59:59") };

  const orders = await prisma.order.findMany({
    where,
    select: { orderedAt: true, totalAmount: true, userId: true },
    orderBy: { orderedAt: "asc" },
  });

  const daily: Record<string, { date: string; orderCount: number; totalAmount: number; userIds: Set<string> }> = {};
  for (const o of orders) {
    const date = o.orderedAt.toISOString().slice(0, 10);
    if (!daily[date]) daily[date] = { date, orderCount: 0, totalAmount: 0, userIds: new Set() };
    daily[date].orderCount++;
    daily[date].totalAmount += o.totalAmount;
    daily[date].userIds.add(o.userId);
  }

  const result = Object.values(daily).map((d) => ({
    date: d.date, orderCount: d.orderCount, totalAmount: d.totalAmount, userCount: d.userIds.size,
  }));

  return NextResponse.json(result);
}
