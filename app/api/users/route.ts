import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page") || 0);
  const limit = Number(searchParams.get("limit") || 20);
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";

  const where: any = {};
  if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }];
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, skip: page * limit, take: limit,
      orderBy: { createdAt: "desc" },
      include: { factory: { select: { id: true, name: true } } },
    }),
    prisma.user.count({ where }),
  ]);
  return NextResponse.json({ users, total });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, password, phone, role, factoryId, isActive } = body;
  if (!name || !email || !password) return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });

  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hash, phone, role, factoryId: factoryId || null, isActive: isActive ?? true },
    });
    return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "이미 존재하는 이메일입니다" }, { status: 409 });
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
