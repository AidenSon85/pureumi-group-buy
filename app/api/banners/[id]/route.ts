import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "MANAGER") return null;
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const banner = await prisma.banner.update({ where: { id }, data: body });
  return NextResponse.json(banner);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  const { id } = await params;
  await prisma.banner.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
