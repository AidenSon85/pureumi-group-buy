import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json();
  try {
    const order = await prisma.order.update({ where: { id }, data: { status } });
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { pickedUp } = await req.json();
  try {
    const order = await prisma.order.update({
      where: { id },
      data: { pickedUpAt: pickedUp ? new Date() : null },
    });
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
