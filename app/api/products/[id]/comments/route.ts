import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comments = await prisma.productComment.findMany({
    where: { productId: id, parentId: null },
    orderBy: { createdAt: "desc" },
    include: {
      replies: { orderBy: { createdAt: "asc" } },
    },
  });
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, phoneDigits, content, parentId, isAdminReply, userId, orderId } = await req.json();

  if (isAdminReply) {
    if (!content?.trim()) return NextResponse.json({ error: "답글 내용을 입력해주세요" }, { status: 400 });
    if (!parentId) return NextResponse.json({ error: "parentId 필요" }, { status: 400 });
    const comment = await prisma.productComment.create({
      data: { productId: id, parentId, name: "관리자", phoneDigits: "0000", content: content.trim(), isAdminReply: true },
    });
    return NextResponse.json(comment, { status: 201 });
  }

  if (!name?.trim()) return NextResponse.json({ error: "이름을 입력해주세요" }, { status: 400 });
  if (!phoneDigits?.trim()) return NextResponse.json({ error: "전화번호 뒷자리를 입력해주세요" }, { status: 400 });
  if (!/^\d{4}$/.test(phoneDigits.trim())) return NextResponse.json({ error: "전화번호 뒷 4자리를 숫자로 입력해주세요" }, { status: 400 });

  const comment = await prisma.productComment.create({
    data: {
      productId: id,
      name: name.trim(),
      phoneDigits: phoneDigits.trim(),
      content: content?.trim() || null,
      userId: userId || null,
      orderId: orderId || null,
    },
  });
  return NextResponse.json(comment, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params;
  const { searchParams } = req.nextUrl;
  const commentId = searchParams.get("commentId");
  if (!commentId) return NextResponse.json({ error: "commentId 필요" }, { status: 400 });

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;

  const comment = await prisma.productComment.findUnique({ where: { id: commentId, productId } });
  if (!comment) return NextResponse.json({ error: "댓글을 찾을 수 없습니다" }, { status: 404 });

  const isAdmin = role === "ADMIN" || role === "MANAGER";
  const isOwner = userId && comment.userId === userId;
  if (!isAdmin && !isOwner) return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });

  await prisma.productComment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
