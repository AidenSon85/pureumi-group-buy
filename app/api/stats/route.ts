import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { subDays, format } from "date-fns";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const factoryId = searchParams.get("factoryId") || "";
  const days = Number(searchParams.get("days") || 14);

  if (!factoryId) return NextResponse.json({ daily: [], activeProducts: 0 });

  const start = subDays(new Date(), days);

  const [dbStats, activeProducts] = await Promise.all([
    prisma.dailyStat.findMany({
      where: { factoryId, date: { gte: start } },
      orderBy: { date: "asc" },
    }),
    prisma.product.count({ where: { factoryId, isActive: true } }),
  ]);

  // 날짜 범위 채우기
  const statsMap: Record<string, any> = {};
  for (const s of dbStats) {
    const key = format(s.date, "MM/dd");
    statsMap[key] = { date: key, salesAmount: s.salesAmount, orderCount: s.orderCount, visitorCount: s.visitorCount };
  }

  const daily = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const key = format(d, "MM/dd");
    daily.push(statsMap[key] || { date: key, salesAmount: 0, orderCount: 0, visitorCount: 0 });
  }

  return NextResponse.json({ daily, activeProducts });
}
