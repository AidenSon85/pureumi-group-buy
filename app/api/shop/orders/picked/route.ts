import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id;
  if (!uid) return NextResponse.json({ canReview: false });

  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) return NextResponse.json({ canReview: false });

  // 이 상품의 OrderItem 중 pickedUpAt이 있는 것 확인
  const item = await prisma.orderItem.findFirst({
    where: {
      productId,
      pickedUpAt: { not: null },
      order: { userId: uid },
    },
  });

  if (!item) return NextResponse.json({ canReview: false });

  const existing = await prisma.productComment.findFirst({
    where: { productId, isReview: true, userId: uid },
  });

  return NextResponse.json({ canReview: !existing, alreadyReviewed: !!existing });
}
