import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: { select: { name: true } }, factory: { select: { name: true } } },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { factoryIds, groupBuyStartAt, groupBuyEndAt, pickupStartAt, ...rest } = body;

  const updateData: any = { ...rest };

  if (factoryIds !== undefined) {
    updateData.factoryIds = factoryIds;
    if (factoryIds.length > 0) updateData.factoryId = factoryIds[0];
  }
  if (groupBuyStartAt !== undefined) {
    updateData.groupBuyStartAt = groupBuyStartAt ? new Date(groupBuyStartAt) : null;
  }
  if (groupBuyEndAt !== undefined) {
    updateData.groupBuyEndAt = groupBuyEndAt ? new Date(groupBuyEndAt) : null;
  }
  if (pickupStartAt !== undefined) {
    updateData.pickupStartAt = pickupStartAt ? new Date(pickupStartAt) : null;
  }

  try {
    const product = await prisma.product.update({ where: { id }, data: updateData });
    return NextResponse.json(product);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
