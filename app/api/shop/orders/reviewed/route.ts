import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id;
  if (!uid) return NextResponse.json([]);

  const reviews = await prisma.productComment.findMany({
    where: { isReview: true, userId: uid },
    select: { productId: true },
  });

  const productIds = [...new Set(reviews.map((r) => r.productId))];
  return NextResponse.json(productIds);
}
