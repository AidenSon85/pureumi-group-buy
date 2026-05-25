import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(categories);
}

async function generateNextCode(): Promise<string> {
  const categories = await prisma.category.findMany({ select: { code: true } });
  const nums = categories.map((c) => {
    const m = c.code.match(/^CATE(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
  });
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `CATE${String(next).padStart(3, "0")}`;
}

export async function POST(req: NextRequest) {
  const { name, sortOrder } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "카테고리명을 입력해주세요" }, { status: 400 });
  const code = await generateNextCode();
  const category = await prisma.category.create({
    data: { code, name: name.trim(), sortOrder: sortOrder ?? 0 },
  });
  return NextResponse.json(category, { status: 201 });
}
