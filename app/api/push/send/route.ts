import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import webpush from "@/lib/webpush";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const factoryId = (session.user as any).factoryId ?? null;
  const { title, body, url } = await req.json();

  if (!title || !body) {
    return NextResponse.json({ error: "title, body 필수" }, { status: 400 });
  }

  const where = factoryId ? { factoryId } : {};
  const subscriptions = await prisma.pushSubscription.findMany({ where });

  let sentCount = 0;
  let failCount = 0;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body, url: url || "/" })
        );
        sentCount++;
      } catch (err: any) {
        failCount++;
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } }).catch(() => {});
        }
      }
    })
  );

  await prisma.notificationLog.create({
    data: { title, body, url: url || null, factoryId, sentCount, failCount },
  });

  return NextResponse.json({ ok: true, sentCount, failCount });
}
