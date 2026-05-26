import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import LocationClient from "./LocationClient";

export default async function LocationPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign/signin");

  const factoryId = (session.user as any)?.factoryId;
  if (!factoryId) redirect("/sign/signin?noFactory=1");

  const factory = await prisma.factory.findUnique({
    where: { id: factoryId },
    select: { name: true, address: true, phone: true, mapUrl: true, parkingInfo: true, businessHours: true },
  });

  if (!factory) redirect("/sign/signin?noFactory=1");

  return <LocationClient factory={factory} />;
}
