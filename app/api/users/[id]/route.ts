import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { password, ...rest } = body;
  const data: any = { ...rest };
  if (rest.factoryId === "") data.factoryId = null;
  if (password) data.password = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ id: user.id });
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
