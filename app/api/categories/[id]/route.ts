import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, sortOrder } = await req.json();
  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "카테고리를 찾을 수 없습니다" }, { status: 404 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "삭제 실패 (해당 카테고리를 사용 중인 제품이 있을 수 있습니다)" }, { status: 400 });
  }
}
