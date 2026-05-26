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

  const item = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId: uid, pickedUpAt: { not: null } },
    },
  });

  if (!item) return NextResponse.json({ canReview: false });

  const existing = await prisma.productComment.findFirst({
    where: { productId, isReview: true, userId: uid },
  });

  return NextResponse.json({ canReview: !existing, alreadyReviewed: !!existing });
}
