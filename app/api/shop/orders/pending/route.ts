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
      items: { some: { productId } },
    },
    orderBy: { orderedAt: "desc" },
  });

  return NextResponse.json(order);
}
