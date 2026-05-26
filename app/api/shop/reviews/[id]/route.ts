import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id;
  if (!uid) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const review = await prisma.productComment.findUnique({ where: { id } });
  if (!review || review.userId !== uid) return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });

  const { rating, content, reviewImages } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "리뷰 내용을 입력해주세요" }, { status: 400 });

  const updated = await prisma.productComment.update({
    where: { id },
    data: {
      rating: rating ? Math.min(5, Math.max(1, Number(rating))) : null,
      content: content.trim(),
      reviewImages: Array.isArray(reviewImages) ? reviewImages : [],
    },
  });
  return NextResponse.json(updated);
}
