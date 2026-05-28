import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page") || 0);
  const limit = Number(searchParams.get("limit") || 20);
  const search = searchParams.get("search") || "";
  const factoryId = searchParams.get("factoryId") || "";
  const statuses = searchParams.get("statuses") || "";
  const productName = searchParams.get("productName") || "";
  const customerName = searchParams.get("customerName") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const userId = searchParams.get("userId") || "";

  const where: any = {};
  if (search) where.orderNo = { contains: search };
  if (factoryId) where.factoryId = factoryId;
  if (userId) where.userId = userId;
  if (statuses) where.status = { in: statuses.split(",") };
  if (productName) where.items = { some: { product: { name: { contains: productName, mode: "insensitive" } } } };
  if (customerName) where.user = { OR: [{ name: { contains: customerName, mode: "insensitive" } }, { email: { contains: customerName, mode: "insensitive" } }] };
  if (startDate || endDate) {
    where.orderedAt = {};
    if (startDate) where.orderedAt.gte = new Date(startDate);
    if (endDate) where.orderedAt.lte = new Date(endDate + "T23:59:59.999Z");
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, skip: page * limit, take: limit,
      orderBy: { orderedAt: "desc" },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        factory: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    }),
    prisma.order.count({ where }),
  ]);
  return NextResponse.json({ orders, total });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const factoryId = (session.user as any).factoryId;
  if (!factoryId) return NextResponse.json({ error: "소속 매장이 없습니다" }, { status: 400 });

  const { items, deliveryAddr, memo } = await req.json();
  if (!items || items.length === 0) return NextResponse.json({ error: "주문 항목이 없습니다" }, { status: 400 });

  const productIds = items.map((i: { productId: string }) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, factoryId, isActive: true },
  });

  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "유효하지 않은 제품이 포함되어 있습니다" }, { status: 400 });
  }

  // 재고 사전 검증
  for (const item of items as { productId: string; quantity: number }[]) {
    const product = products.find((p: any) => p.id === item.productId)!;
    if (product.stock <= 0) {
      return NextResponse.json({ error: `${product.name} 품절입니다` }, { status: 400 });
    }
    if (product.stock < item.quantity) {
      return NextResponse.json({ error: `${product.name} 재고가 부족합니다 (남은 재고: ${product.stock}${product.unit})` }, { status: 400 });
    }
  }

  const orderItems = (items as { productId: string; quantity: number }[]).map((item) => {
    const product = products.find((p: any) => p.id === item.productId)!;
    const price = product.salePrice ?? product.price;
    return { productId: item.productId, quantity: item.quantity, price, amount: price * item.quantity };
  });

  const totalAmount = orderItems.reduce((sum, i) => sum + i.amount, 0);
  const orderNo = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  try {
    const order = await prisma.$transaction(async (tx) => {
      // 재고 차감 (동시 주문 경합 방지: stock >= quantity 조건으로 원자적 처리)
      for (const item of orderItems) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          const product = products.find((p: any) => p.id === item.productId)!;
          throw new Error(`${product.name} 재고가 부족합니다`);
        }
      }
      return tx.order.create({
        data: { orderNo, userId, factoryId, totalAmount, deliveryAddr: deliveryAddr || null, memo: memo || null, items: { create: orderItems } },
      });
    });
    return NextResponse.json(order, { status: 201 });
  } catch (e: any) {
    if (e.message?.includes("재고가 부족") || e.message?.includes("품절")) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: "주문 생성 실패" }, { status: 500 });
  }
}
