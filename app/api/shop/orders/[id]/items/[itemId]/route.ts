import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: orderId, itemId } = await params;
    const userId = (session.user as any).id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return NextResponse.json({ error: "주문을 찾을 수 없습니다" }, { status: 404 });
    if (order.userId !== userId) return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    if (order.status === "CANCELLED") return NextResponse.json({ error: "이미 취소된 주문입니다" }, { status: 400 });

    const item = order.items.find((i) => i.id === itemId);
    if (!item) return NextResponse.json({ error: "상품을 찾을 수 없습니다" }, { status: 404 });
    if (item.status === "CANCELLED") return NextResponse.json({ error: "이미 취소된 상품입니다" }, { status: 400 });

    // 해당 아이템 취소 + 관련 댓글 삭제
    await prisma.orderItem.update({ where: { id: itemId }, data: { status: "CANCELLED" } });
    await prisma.productComment.deleteMany({ where: { orderId, productId: item.productId } });

    // 취소 후 DB 재조회 — "CANCELLED"가 아닌 아이템을 남은 아이템으로 간주
    const allItems = await prisma.orderItem.findMany({ where: { orderId } });
    const remaining = allItems.filter((i) => i.id !== itemId && i.status !== "CANCELLED");

    if (remaining.length === 0) {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED", totalAmount: 0 },
        include: { factory: { select: { name: true } }, items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } } },
      });
      return NextResponse.json(updated);
    } else {
      const newTotal = remaining.reduce((sum, i) => sum + i.amount, 0);
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { totalAmount: newTotal },
        include: { factory: { select: { name: true } }, items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } } },
      });
      return NextResponse.json(updated);
    }
  } catch (e: any) {
    console.error("[item-cancel]", e?.message, e?.code);
    return NextResponse.json({ error: e?.message || "서버 오류" }, { status: 500 });
  }
}
