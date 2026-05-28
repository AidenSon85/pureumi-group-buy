import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { authOptions } from "@/lib/auth";
import { CartProvider } from "@/components/shop/CartContext";
import { ShopUserProvider } from "@/components/shop/ShopUserContext";
import ShopHeader from "@/components/shop/ShopHeader";
import prisma from "@/lib/prisma";
import { Box, Toolbar } from "@mui/material";

const getCachedFactory = unstable_cache(
  (factoryId: string) =>
    prisma.factory.findUnique({
      where: { id: factoryId },
      select: { name: true, address: true, phone: true, mapUrl: true, parkingInfo: true, businessHours: true },
    }),
  ["shop-factory"],
  { revalidate: 3600 }
);

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign/signin");

  const role = (session.user as any)?.role;
  if (role === "ADMIN" || role === "MANAGER") redirect("/manage");
  if (role !== "CUSTOMER") redirect("/sign/signin");

  const factoryId = (session.user as any)?.factoryId;
  if (!factoryId) redirect("/sign/signin?noFactory=1");

  const factory = await getCachedFactory(factoryId);
  const factoryName = factory?.name || "";
  const userId = (session.user as any)?.id ?? "";
  const userName = session.user?.name || "";

  return (
    <ShopUserProvider value={{ factoryId, userId, userName }}>
      <CartProvider>
        <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9fa" }}>
          <ShopHeader
            userName={userName}
            factoryName={factoryName}
            factoryLocation={{
              address: factory?.address || null,
              phone: factory?.phone || null,
              mapUrl: factory?.mapUrl || null,
              parkingInfo: factory?.parkingInfo || null,
              businessHours: factory?.businessHours || null,
            }}
          />
          <Toolbar />
          <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 3 }, py: 3 }}>
            {children}
          </Box>
        </Box>
      </CartProvider>
    </ShopUserProvider>
  );
}
