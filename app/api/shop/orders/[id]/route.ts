import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as any).id;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "주문을 찾을 수 없습니다" }, { status: 404 });
  if (order.userId !== userId) return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  if (order.status !== "PENDING") return NextResponse.json({ error: "대기 상태의 주문만 취소할 수 있습니다" }, { status: 400 });

  const updated = await prisma.order.update({ where: { id }, data: { status: "CANCELLED" } });
  return NextResponse.json(updated);
}
