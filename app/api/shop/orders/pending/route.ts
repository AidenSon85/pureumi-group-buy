import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) return NextResponse.json(null);

  const order = await prisma.order.findFirst({
    where: {
      userId,
      status: "PENDING",
      items: { some: { productId, status: { not: "CANCELLED" } } },
    },
    orderBy: { orderedAt: "desc" },
    include: {
      items: {
        where: { productId, status: { not: "CANCELLED" } },
        select: { id: true },
      },
    },
  });

  if (!order) return NextResponse.json(null);

  return NextResponse.json({ id: order.id, itemId: order.items[0]?.id ?? null });
}
