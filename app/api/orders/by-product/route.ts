import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const factoryId = searchParams.get("factoryId") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  const where: any = {};
  if (factoryId) where.order = { factoryId };
  if (startDate || endDate) {
    where.order = { ...where.order, orderedAt: {} };
    if (startDate) where.order.orderedAt.gte = new Date(startDate);
    if (endDate) where.order.orderedAt.lte = new Date(endDate + "T23:59:59");
  }

  const items = await prisma.orderItem.findMany({
    where,
    include: {
      product: { select: { id: true, name: true, imageUrl: true, factory: { select: { name: true } } } },
    },
  });

  const map: Record<string, any> = {};
  for (const item of items) {
    const pid = item.product.id;
    if (!map[pid]) {
      map[pid] = {
        productId: pid, productName: item.product.name, imageUrl: item.product.imageUrl,
        factoryName: item.product.factory.name, orderCount: 0, totalQty: 0, totalAmount: 0,
      };
    }
    map[pid].orderCount++;
    map[pid].totalQty += item.quantity;
    map[pid].totalAmount += item.amount;
  }

  const result = Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  return NextResponse.json(result);
}
