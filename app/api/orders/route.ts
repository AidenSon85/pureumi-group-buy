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
  const status = searchParams.get("status") || "";

  const where: any = {};
  if (search) where.OR = [{ orderNo: { contains: search } }, { user: { name: { contains: search, mode: "insensitive" } } }];
  if (factoryId) where.factoryId = factoryId;
  if (status) where.status = status;

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

  const orderItems = (items as { productId: string; quantity: number }[]).map((item) => {
    const product = products.find((p: { id: string; salePrice: number | null; price: number }) => p.id === item.productId)!;
    const price = product.salePrice ?? product.price;
    return { productId: item.productId, quantity: item.quantity, price, amount: price * item.quantity };
  });

  const totalAmount = orderItems.reduce((sum, i) => sum + i.amount, 0);
  const orderNo = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  try {
    const order = await prisma.order.create({
      data: { orderNo, userId, factoryId, totalAmount, deliveryAddr: deliveryAddr || null, memo: memo || null, items: { create: orderItems } },
    });
    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: "주문 생성 실패" }, { status: 500 });
  }
}
