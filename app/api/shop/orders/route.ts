import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { orderedAt: "desc" },
    include: {
      factory: { select: { name: true } },
      items: {
        include: { product: { select: { id: true, name: true, imageUrl: true } } },
      },
    },
  });

  return NextResponse.json(orders);
}
