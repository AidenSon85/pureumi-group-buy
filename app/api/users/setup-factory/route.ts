import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { factoryCode } = await req.json();
  if (!factoryCode) return NextResponse.json({ error: "factoryCode required" }, { status: 400 });

  const factory = await prisma.factory.findUnique({ where: { code: factoryCode } });
  if (!factory) return NextResponse.json({ error: "매장을 찾을 수 없습니다" }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: token.sub } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.factoryId) {
    return NextResponse.json({ factoryId: user.factoryId });
  }

  await prisma.user.update({
    where: { id: token.sub },
    data: { factoryId: factory.id },
  });

  return NextResponse.json({ factoryId: factory.id });
}
