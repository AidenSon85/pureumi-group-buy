import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import FactoryLandingClient from "./FactoryLandingClient";

export default async function FactoryLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const factory = await prisma.factory.findUnique({
    where: { slug },
    select: { id: true, name: true, code: true, isActive: true },
  });

  if (!factory || !factory.isActive) notFound();

  const session = await getServerSession(authOptions);
  if (session) {
    const role = (session.user as any)?.role;
    if (role === "ADMIN" || role === "MANAGER") redirect("/manage");

    const factoryId = (session.user as any)?.factoryId;
    if (factoryId) redirect("/shop/products");

    // 로그인 됐지만 매장 미배정 → 이 매장으로 setup
    redirect(`/shop/setup?f=${factory.code}`);
  }

  return <FactoryLandingClient factoryName={factory.name} factoryCode={factory.code} />;
}
