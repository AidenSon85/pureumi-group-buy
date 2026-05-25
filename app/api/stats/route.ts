import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { subDays, format, parseISO, differenceInDays, addDays } from "date-fns";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const factoryId = searchParams.get("factoryId") || "";
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const days = Number(searchParams.get("days") || 14);

  let start: Date;
  let end: Date;

  if (startDateParam && endDateParam) {
    start = parseISO(startDateParam);
    end = parseISO(endDateParam);
  } else {
    end = new Date();
    start = subDays(end, days - 1);
  }

  const endInclusive = new Date(end);
  endInclusive.setHours(23, 59, 59, 999);

  const whereFactory = factoryId ? { factoryId } : {};

  const [dbStats, activeProducts] = await Promise.all([
    prisma.dailyStat.findMany({
      where: { ...whereFactory, date: { gte: start, lte: endInclusive } },
      orderBy: { date: "asc" },
    }),
    prisma.product.count({ where: { ...whereFactory, isActive: true } }),
  ]);

  // 날짜별로 집계 (전체 매장은 같은 날짜 합산)
  const statsMap: Record<string, { salesAmount: number; orderCount: number; visitorCount: number }> = {};
  for (const s of dbStats) {
    const key = format(s.date, "MM/dd");
    if (statsMap[key]) {
      statsMap[key].salesAmount += s.salesAmount;
      statsMap[key].orderCount += s.orderCount;
      statsMap[key].visitorCount += s.visitorCount;
    } else {
      statsMap[key] = { salesAmount: s.salesAmount, orderCount: s.orderCount, visitorCount: s.visitorCount };
    }
  }

  const totalDays = differenceInDays(end, start) + 1;
  const daily = [];
  for (let i = 0; i < totalDays; i++) {
    const d = addDays(start, i);
    const key = format(d, "MM/dd");
    daily.push({ date: key, ...(statsMap[key] || { salesAmount: 0, orderCount: 0, visitorCount: 0 }) });
  }

  return NextResponse.json({ daily, activeProducts });
}
